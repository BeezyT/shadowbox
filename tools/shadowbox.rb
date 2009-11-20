require 'fileutils'
require 'optparse'
require 'erb'

module Shadowbox
  @source_dir = File.dirname(__FILE__) + '/../lib'

  # get the current version of the code from the source
  @current_version = File.open(@source_dir + '/shadowbox.js') do |f|
    f.read.match(/version: ['"]([\w.]+)['"]/)[1]
  end

  %w{adapters players languages}.each do |dir|
    available = Dir.glob(@source_dir + "/#{dir}/*.js").map do |file|
      file.match(/shadowbox-(.+?)\.js/)[1]
    end
    instance_variable_set("@available_#{dir}".to_sym, available)
  end

  class << self
    attr_reader :source_dir, :current_version
    attr_reader :available_adapters, :available_players, :available_languages

    def valid_adapter?(adapter)
      @available_adapters.include?(adapter)
    end

    def valid_player?(player)
      @available_players.include?(player)
    end

    def valid_language?(language)
      @available_languages.include?(language)
    end
  end

  class Builder
    attr_reader :argv, :errors

    NOTICE = %q{
    This directory contains a custom build of the Shadowbox Media Viewer script, and
    contains only a subset of the features available. All of the files necessary to
    run Shadowbox have been combined into as few as possible in order to decrease load
    time and the number of server requests that need to be made.

    This particular build includes support for the following features:

    Language: <%=@language%>
    Adapter:  <%=@adapter%>
    Players:  <%=@players.join(', ')%>

    <%="Support for CSS selectors is also included via Sizzle.js <http://sizzlejs.com/>." if @sizzle%>
    <%="The code was compressed using the YUI Compressor <http://developer.yahoo.com/yui/compressor/>." if @compress%>

    For more information, please visit the Shadowbox website at http://shadowbox-js.com/.
    }.gsub(/^    /, '')

    def initialize(argv)
      @argv       = argv
      @errors     = []

      @version    = Shadowbox.current_version
      @adapter    = 'base'
      @compress   = false
      @force      = false
      @language   = 'en'
      @target     = "./shadowbox-#{@version}"
      @players    = Shadowbox.available_players
      @sizzle     = false
      @swfobject  = false

      parse!
    end

    def parser
      @parser ||= OptionParser.new do |opts|
        opts.banner = "Usage: #{$PROGRAM_NAME} [options]"
        opts.separator ""
        opts.on("-aADAPTER", "--adapter=ADAPTER", %{The adapter to use, defaults to "#{@adapter}"}) {|adapter| @adapter = adapter }
        opts.on("-c", "--compress", %{Use compressed versions of the code}) { @compress = true }
        opts.on("-f", "--force", %{Clobber a target directory if one already exists}) { @force = true }
        opts.on("-lLANGUAGE", "--language=LANGUAGE", %{The language to use, defaults to "#{@language}"}) {|language| @language = language }
        opts.on("-pPLAYERS", "--players=PLAYERS", %{A comma-separated list of players to include, defaults to "#{@players.join(',')}"}) {|players| @players = players.split(',') }
        opts.on("-s", "--sizzle", "Include CSS selector support using Sizzle.js") { @sizzle = true }
        opts.on("-tTARGET", "--target=TARGET", %{The target directory, defaults to #{@target}}) {|target| @target = target }
        opts.on_tail("-h", "--help", "Show this message") { puts opts; exit }
      end
    end

    def parse!
      parser.parse! @argv
      @target = File.expand_path(@target)
      @players.uniq!

      # include swfobject if swf or flv players are being used
      @swfobject = @players.include?('swf') || @players.include?('flv')

      @errors << %{Invalid adapter: #{@adapter}} unless Shadowbox.valid_adapter?(@adapter)
      @errors << %{Invalid language: #{@language}} unless Shadowbox.valid_language?(@language)
      invalid_players = @players.reject {|player| Shadowbox.valid_player?(player) }
      @errors << %{Invalid player(s): #{invalid_players.join(',')}} if invalid_players.any?
      output_dir = File.dirname(@target)
      if !File.writable?(output_dir)
        @errors << %{Output directory (#{output_dir}) is not writable}
      elsif File.exist?(@target)
        if @force
          FileUtils.rm_rf(@target)
          FileUtils.mkdir_p(@target)
        else
          @errors << %{Target directory (#{@target}) already exists, use --force to overwrite}
        end
      else
        FileUtils.mkdir_p(@target)
      end
    end

    def run
      source = Shadowbox.source_dir

      # create javascript file list
      jsfiles = [
        "shadowbox.js",
        "adapters/shadowbox-#{@adapter}.js",
        "languages/shadowbox-#{@language}.js"
      ] + @players.map {|player| "players/shadowbox-#{player}.js" }
      jsfiles << "libraries/sizzle/sizzle.js" if @sizzle
      jsfiles << "libraries/swfobject/swfobject.js" if @swfobject

      # compile js
      js = jsfiles.map {|file| read_js(File.join(source, file)) }
      js << %<Shadowbox.options.players=["#{@players.join('","')}"];>
      js << %<Shadowbox.options.useSizzle=#{@sizzle};>
      File.open("#{@target}/shadowbox.js", 'w') {|file| file.print js.join("\n") }

      # compile css
      css = read_css(File.join(source, "shadowbox.css"))
      File.open("#{@target}/shadowbox.css", 'w') {|file| file.print css }

      # copy all other resources
      FileUtils.cp_r  "#{source}/resources",            "#{@target}/"
      FileUtils.mkdir "#{@target}/libraries"
      FileUtils.cp_r  "#{source}/libraries/sizzle",     "#{@target}/libraries/" if @sizzle
      FileUtils.cp_r  "#{source}/libraries/swfobject",  "#{@target}/libraries/" if @swfobject

      FileUtils.cp File.dirname(__FILE__) + '/../README', "#{@target}/"
      FileUtils.cp File.dirname(__FILE__) + '/../LICENSE', "#{@target}/"
      File.open("#{@target}/BUILD", 'w') {|file| file.print notice }
    end

    def read_js(input_file)
      @compress ? compress_js(input_file) : File.read(input_file)
    end

    def read_css(input_file)
      @compress ? compress_css(input_file) : File.read(input_file)
    end

    def compress_js(input_file)
      puts "compressing " + File.basename(input_file)
      compressor = File.dirname(__FILE__) + '/yuicompressor/yuicompressor-2.4.2.jar'
      %x<java -jar #{compressor} #{input_file}>
    end

    def compress_css(input_file)
      puts "compressing " + File.basename(input_file)
      css = File.read(input_file)
      css.gsub!(/\/\*.*?\*\//m, '')
      css.gsub!(/^\s+/, '')
      css.gsub!(/(,|:)\s+/, '\1')
      css.gsub!(/\s+\{/, '{')
      css
    end

    def notice
      template = ERB.new(NOTICE)
      template.result(binding)
    end

    def errors!
      abort(@errors.join("\n")) if @errors.any?
    end

    def run!
      errors!
      run
    end
  end
end
