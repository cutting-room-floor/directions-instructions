**STATUS: backburner. This will eventually be in production, but is not yet used anywhere, since there are more pressing issues to tackle for directions.**

# directions-instructions

This module contains all of the translatable strings in
the [Mapbox Directions API](https://www.mapbox.com/developers/api/directions/),
which is a simple transformation from [OSRM](http://project-osrm.org/)
output into sentences.

These strings are translated in [Transifex under the
mapbox/directions-instructions project](https://www.transifex.com/mapbox/directions-instructions/).
Translations are pulled back into this project using the `sync_transifex.js`
script.

### `sync_transifex.js`

This script downloads updated translations from Transifex and saves them
in the `translations.json` file: to run this script you'll need the environment
variables

* `TRANSIFEX_USER`
* `TRANSIFEX_PASSWORD`

Set in your terminal environment to valid Transifex credentials.

### `english.json`

This is the **source** of our translatable strings: when it is updated,
you need to manually import it into Transifex and Transifex will merge
previously-translated strings with the new and updated set.

### `translations.json`

This is the **output** of translations: it is created with `sync_transifex.js`.

### `index.js`

The JavaScript file loaded in a call to `require('directions-instructions')`:
this loads and combines the `english.json` source file and `translations.json`
file to produce an object with a form like:

```js
strings = {
  // iso codes
  "en": {
    "instructions": {
      "1": "Continue"
    }
    // ....
  },
  "es": {
    "instructions": {
      "1": "Continuar"
    }
    // ....
  }
}
```
