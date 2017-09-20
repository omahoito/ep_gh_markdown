var underscore = require('ep_etherpad-lite/static/js/underscore');
var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
var padEditor;
var image = {
  removeImage: function(lineNumber){
    var documentAttributeManager = this.documentAttributeManager;
    // This errors for some reason..
    documentAttributeManager.removeAttributeOnLine(lineNumber, 'img'); // make the line a task list
  },
  addImage: function(rep, src){
    var documentAttributeManager = this.documentAttributeManager;
    // Get the line number
    var lineNumber = rep.selStart[0];
    // This errors for some reason..
    src = "<img src="+src+">";
    documentAttributeManager.setAttributeOnLine(lineNumber, 'img', src); // make the line a task list
  }
}

exports.aceInitialized = function(hook, context){
  var editorInfo = context.editorInfo;
  editorInfo.ace_addImage = underscore(image.addImage).bind(context);
  editorInfo.ace_removeImage = underscore(image.removeImage).bind(context);
}

exports.postAceInit = function (hook, context) {
  context.ace.callWithAce(function (ace) {
    var doc = ace.ace_getDocument();
    var $inner = $(doc).find('#innerdocbody');
    var lineHasContent = false;
    
    $('.ep_gh_markdown').click(function () {
      var confirmed = confirm("Convert from markdown?\nWARNING! This cannot be undone!")
      if (confirmed) {
        toggleMarkdown(context, $inner);
        $(this).addClass('clicked'); // Tests need this
      } 
    })

    // This is not hacky at all.
    // Get html content of body, strip span and s tags -> convert html to md
    // Create uri from md string and make temp link, sim click and download the .md file
    // This is the simplest way to get html content of the pad for conversion.
    // Also allows us to add file extensions.
    $("#export_md").click(function () {
      var md = [];
      $($inner).find('div:not(".original")').each(function () {
        var magicChild = $(this).html();
        var stripped = magicChild.replace(/(<span class=".+?">)(.*?)(<\/span>)/g, '$2');
        stripped = stripped.replace(/(<s>)(.*?)(<\/s>)/g, "~~$2~~");
        stripped = stripped.replace("", "<p></p>");
        md.push(toMarkdown(stripped));
      });
      mdString = md.join('\n');
      var uriContent = "data:application/octet-stream," + encodeURIComponent(mdString);
      var link = document.createElement("a");    
      link.href = uriContent;
      link.style = "visibility:hidden";
      link.download = "markdown.md";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })

    var markdown = {
      enable: function() {
        $($inner).addClass("markdown"); // add css class markdown
        $('#underline').hide(); // no markdown support for these
        $('#strikethrough').hide();
      },
      disable: function() {
        $($inner).removeClass("markdown"); // add css class markdown
        $('#underline').removeAttr('style'); // no markdown support for these
        $('#strikethrough').removeAttr('style');
      }
    }

    if($('#options-markdown').is(':checked')) {
      markdown.enable();
    } else {
      markdown.disable();
    }
    /* on click */
    $('#options-markdown').on('click', function() {
      if($('#options-markdown').is(':checked')) {
        markdown.enable();
      } else {
        markdown.disable();
      }
    });

    // ------- Imported from ep_copy_paste_images ------------
    $inner.on("drop", function (e) {
      e = e.originalEvent;
      var file = e.dataTransfer.files[0];
      if (!file) return;
      // don't try to mess with non-image files
      if (file.type.match('image.*')) {
        var reader = new FileReader();
        reader.onload = (function (theFile) {
          //get the data uri
          var dataURI = theFile.target.result;
          //make a new image element with the dataURI as the source
          var img = document.createElement("img");
          img.src = dataURI;
          // Now to insert the base64 encoded image into the pad
          context.ace.callWithAce(function (ace) {
            var rep = ace.ace_getRep();
            ace.ace_addImage(rep, img.src);
          }, 'img', true);

        });
        reader.readAsDataURL(file);
      }
    });

    // On control select do fuck all, I hate this..
    $inner.on("oncontrolselect", ".control", function () {
    })

    // On drag end remove the attribute on the line
    // Note we check the line number has actually changed, if not a drag start/end
    // to the same location would cause the image to be deleted!
    $inner.on("dragend", ".image", function (e) {
      var id = e.currentTarget.id;
      var imageContainer = $inner.find("#" + id);
      var imageLine = $inner.find("." + id).parents("div");
      var oldLineNumber = imageLine.prevAll().length;
      context.ace.callWithAce(function (ace) {
        var rep = ace.ace_getRep();
        var newLineNumber = rep.selStart[0];
        if (oldLineNumber !== newLineNumber) {
          // We just nuke the HTML, potentially dangerous but seems to work
          $(imageContainer).remove();
          // We also remove teh attribute hoping we get the number right..
          ace.ace_removeImage(oldLineNumber);
        }
      }, 'img', true);
      // TODO, if the image is moved only one line up it will create a duplicate
      // IF the line is already populated, nothing much I can do about that for now
    })
    // --------------------------------------
  }, 'img', true);
}

function toggleMarkdown(context, $inner) {
  var converter = new showdown.Converter();
      converter.setFlavor('github');
    // Add identifying class to original text before converting and hide it
    $($inner).find('div').addClass("original");
    var contents = [];
    var inCode = false;

    // Map through each magicdiv within ace body and get the text
    $inner.children('div').each(function () {
      var text = $(this).text();
      text = text.replace(/(>\s*)(-)/, '$1&ndash;'); // Replace - with ndash when in blockquote so we don't make accidental lists.
      if (/^```/igm.test(text)) inCode = inCode ? false : true;
      if (!inCode && !/^>/.test(text)) {
        if (text.replace(/\s/g, '').length) text += '\n<br>'; // Force linebreak after each line
        else text = '<p><br></p>'; // If text is a newline or contains only spaces feed new line (<br> wont work because we need to 'break' the last element)
      }
      text = text.replace(/[\u00A0 \t]+$/igm, '') // Trim trailing whitespace
      if (/^>/igm.test(text)) text += ' '; // For some _really_ odd reason, if blockquote string does not have trailing space, last bq line will be ignored.
      contents.push(text);
      
    });
    // Join the text and convert to html with showdown.js
    contents = contents.join('\n').toString();
    contents = converter.makeHtml(contents);
    $($inner).find('.original').remove();
    $inner.append(contents);
}

exports.acePostWriteDomLineHTML = function (hook, context) {
  // After the node has been written detect code block and use highlight.js to add styles for it.
  if (context.node.children) {
    for (var child of context.node.children) {
      if (child.nodeName === "CODE") {
        hljs.highlightBlock(child);
      }
    }
  }
}

// Register image tags so we can collect the content
exports.ccRegisterBlockElements = function (name, context) {
  return ['img'];
}

// Collect contents from converted html and add attributes
exports.collectContentPre = function (hook, context) {
  var cc = context.cc;
  var state = context.state;
  var tname = context.tname;
  var url = /(?:^| )url-(\S*)/.exec(context.cls);
  var lang = /(?:^| )language-(\S*)/.exec(context.cls);
  if (url) cc.doAttrib(state, "url::" + url[1]);
  if (lang) cc.doAttrib(state, "lang::" + lang[1]);
  if (tname == "code") cc.doAttrib(state, "code");
  if (tname == "blockquote") cc.doAttrib(state, "blockquote");
}

exports.collectContentImage = function (name, context) {
  var tname = context.tname;
  var state = context.state;
  var node = context.node;

  if (tname == "img") {
    if (node.src) state.lineAttributes['img'] = 'img-' + node.src;
    if (node.alt) state.lineAttributes['alt'] = 'alt-' + node.alt;
  }
}

// Convert the attributes to classes so we can catch them @ createDomLine fn
exports.aceAttribsToClasses = function (hook_name, context) {
  var key = context.key;
  var value = context.value;
  if (key == 'url') return ['url-' + value];
  if (key == 'img') return [value];
  if (key == 'alt') return [value];
  if (key == 'code') return ['code'];
  if (key == 'blockquote') return ['blockquote'];
  if (key == 'lang') return ['language-' + value];
}

exports.aceDomLinePreProcessLineAttributes = function (hook, context) {
  var cls = context.cls;
  var img = /(?:^| )img-(\S*)/.exec(cls);
  var alt = /(?:^| )alt-(\S*)/.exec(cls);
  if (alt) alt = alt[1];
  var modifier = {
    preHtml: '',
    postHtml: '',
    processedMarker: false
  };

  if (img) {
    img = hasHttp(img[1]);
    modifier = {
      preHtml: `<img src="${img}" style="height: auto; width: auto;">`,
      postHtml: '</img>',
      processedMarker: true
    }
  }
  return [modifier];
}

// Check the classes and add required tags
exports.aceCreateDomLine = function (hook, context) {
  var cls = context.cls;
  var url = /(?:^| )url-(\S*)/.exec(cls);
  var code = /code/.exec(cls);
  var blockquote = /blockquote/.exec(cls);
  var lang = /(?:^| )language-(\S*)/.exec(cls);
  if (lang) lang = 'language-' + lang[1];
  if (lang == null) lang = '';
  var modifier = {
    extraOpenTags: '',
    extraCloseTags: '',
    cls: cls
  };
  if (url) {
    url = hasHttp(url[1]);
    modifier = {
      extraOpenTags: '<a href="' + url + '">',
      extraCloseTags: '</a>',
      cls: cls
    }
  }
  if (code) modifier = { extraOpenTags: '<code class="' + lang + '">', extraCloseTags: '</code>', cls: cls };
  if (blockquote) modifier = { extraOpenTags: '<blockquote>', extraCloseTags: '</blockquote>', cls: cls};

  return [modifier];
}

function hasHttp(url) {
  if (!/^http:\/\//.test(url) && !/^https:\/\//.test(url)) url = "http://" + url;
  return url;
}

exports.aceEditorCSS = function (hook_name, cb) {
  return ["/ep_gh_markdown/static/css/markdown.css", "/ep_gh_markdown/static/css/highlight.css"];
} // inner pad CSS