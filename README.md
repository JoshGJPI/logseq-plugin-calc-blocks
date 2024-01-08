## Calc Notes Plugin
- This will calculate block contents after := and add the result at the end of the block
- All mathematical operators and values must be space separated: ie.
  - *before* sample name := ( 25psf + 15psf ) / 2
  - *after* sample name := ( 25psf + 15psf ) / 2 = 20psf
- Units are currently ignored. The last unit displayed in the equation will be copied onto the result
  - *example* sample := 20psf * 10ft = 200ft
  - *current workaround* sample := 20psf * 10ft + 0plf = 200plf
  
### API

[![npm version](https://badge.fury.io/js/%40logseq%2Flibs.svg)](https://badge.fury.io/js/%40logseq%2Flibs)

##### Logseq.Editor

- `registerSlashCommand: (this: LSPluginUser, tag: string, actions: Array<SlashCommandAction>) => boolean`
- `showMsg: (content: string, status?: 'success' | 'warning' | string) => void`
    - content support  [hiccups](https://github.com/weavejester/hiccup) string

### Running the Sample

- `Load unpacked plugin` in Logseq Desktop client.
