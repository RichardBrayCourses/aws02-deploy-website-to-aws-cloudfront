# Bootstrap lesson

- create bootstrap folder, the 4 script files and the package.json inside it
- add the following lines to the root package.json file

```json
    "bootstrap-up": "pnpm -C bootstrap/scripts run bootstrap-up",
    "bootstrap-down": "pnpm -C bootstrap/scripts run bootstrap-down",
```

the run the following command

```
$ pnpm run bootstrap-up
```

This will bootstrap the system.

To remove the bootstrap resources run

```
$ pnpm run bootstrap-down
```
