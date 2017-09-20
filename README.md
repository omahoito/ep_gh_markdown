# Support for GitHub flavoured markdown
* Export as markdown
* Import markdown (or write it) and convert it!
* Combined features from [ep_copy_paste_images](https://github.com/JohnMcLear/ep_copy_paste_images) & [ep_markdown](https://github.com/ether/ep_markdown)
## Instructions
You need to uninstall [ep_copy_paste_images](https://github.com/JohnMcLear/ep_copy_paste_images) and [ep_markdown](https://github.com/ether/ep_markdown) (Don't worry, this plugin has features from both of them)
```
npm uninstall ep_copy_paste_images ep_markdown
```
Install dependencies
```
npm install ep_headings2
```
Install plugin
```
npm install @omahoito/ep_gh_markdown
```

## Tests
1. Specs are located in static/js/tests/frontend/specs
2. Visit http://youretherpadserver/tests/frontend and your tests will run.

## TODO / Known issues
- [ ] Support for tables
- [ ] Support for Horizontal Rule
- [ ] Image resize
- [ ] Ordered list numbering (Can now be fixed by manually adding a newline after each ordered list)
- [ ] Convert directly to markdown (Currently only supported as export)
- [ ] Automated push/pull git integration

# Thanks to
[ep_copy_paste_images](https://github.com/JohnMcLear/ep_copy_paste_images)  
[ep_markdown](https://github.com/ether/ep_markdown)
