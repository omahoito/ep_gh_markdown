var eejs = require('ep_etherpad-lite/node/eejs/');
var settings = require('ep_etherpad-lite/node/utils/Settings');

exports.eejsBlock_editbarMenuRight = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_gh_markdown/templates/editbarButtons.ejs");
  return cb();
}

exports.eejsBlock_dd_format = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_gh_markdown/templates/fileMenu.ejs");
  return cb();
}

exports.eejsBlock_scripts = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_gh_markdown/templates/scripts.html", {}, module);
  return cb();
};

exports.eejsBlock_exportColumn = function(hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_gh_markdown/templates/exportcolumn.html", {}, module);
  return cb();
};

exports.eejsBlock_mySettings = function (hook_name, args, cb) {
  if (!settings.ep_markdown_default){
    checked_state = 'unchecked';
  }else{
    if(settings.ep_markdown_default == true){
      checked_state = 'checked';
    }
  }
  args.content = args.content + eejs.require('ep_gh_markdown/templates/markdown_entry.ejs', {checked : checked_state});
  return cb();
}