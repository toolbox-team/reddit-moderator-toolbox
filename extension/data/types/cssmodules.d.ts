// Module type declarations for CSS module files imported into JS/TS.

declare module '*.module.css' {
    const classes: {[key: string]: string};
    export default classes;
}
