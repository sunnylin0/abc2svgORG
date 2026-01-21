// abc2svg - Front module (Entry point)
import type { Abc } from '../Abc';
import * as abc2svg from '../abc2svg';

export class Front {
    abc: Abc;

    constructor(abc: Abc) {
        this.abc = abc;
    }

    // Main entry point
    tosvg(file: string, in_fname: string) {
        let abc = this.abc;
        let cfmt = abc.cfmt;
        let info = abc.info;
        let parse = abc.parse;
        let user = abc.user;
        let sav: any = {};

        // internal state for scanning
        let bol = 0;
        let eof = file.length;
        let eol;
        let line0, line1;
        let text, a, b, i;
        let pscom = false;
        let select: string | undefined;
        let last_info: string | undefined;
        let txt_add = '\n';
        let end;

        // initialize
        parse.line.buffer = ""; // ScanBuf
        // parse.file = file; // TODO: scanbuf handles this? or we need parsing context

        // Helper to remove comments
        const uncomment = (text: string, info?: any) => {
            // simplified uncomment logic
            let i = text.indexOf('%');
            if (i >= 0) {
                // handle %% 
                if (text[i + 1] == '%') {
                    // keep it? logic is complex for %% in headers
                } else {
                    text = text.slice(0, i).trim();
                }
            }
            return text.trim();
        };

        const syntax = (sev: number, msg: string, ...args: any[]) => {
            this.abc.error(sev, null, msg, ...args);
        };

        const tune_selected = () => {
            // ... logic for %%select
            return true;
        };

        const set_src = (b: string, i?: number) => {
            // source display logic
        };

        const end_tune = () => {
            // logic to finish tune
            // call tune.end_tune() ? or similar
        };

        const do_info = (k: string, v: string) => {
            // handle info fields
            if (k == 'K') {
                this.abc.parser.new_key(v);
            } else if (k == 'M') {
                this.abc.parser.new_meter(v);
            }
            // ...
        }

        // scan the file
        if (file.slice(bol, bol + 5) == "%abc-") {
            // cfmt["abc-version"] = ...
        }

        for (; bol < eof; bol = parse.eol + 1) {
            eol = file.indexOf('\n', bol);
            if (eol < 0 || eol > eof) eol = eof;
            parse.eol = eol;

            // ... whitespace trimming logic ...

            // check empty line
            if (eol == bol || file.slice(bol, eol).trim().length == 0) {
                if (parse.state == 1) { // tune header
                    syntax(1, "Empty line in tune header - ignored");
                } else if (parse.state >= 2) {
                    end_tune();
                    parse.state = 0;
                }
                continue;
            }

            // check pseudo-comments
            line0 = file[bol];
            line1 = file[bol + 1];
            if ((line0 == 'I' && line1 == ':') || line0 == '%') {
                // pscom handling
                let line = file.slice(bol, eol);
                let content = line.slice(2).trim(); // remove %% or I:
                if (content)
                    this.abc.set_format(content, ""); // generic delegation
                continue;
            }

            // music line
            if (line1 != ':' || !/[A-Za-z+]/.test(line0)) {
                last_info = undefined;
                if (parse.state < 2) continue;

                // Parse music line
                this.abc.parser.parse_music_line(file.slice(bol, eol));
                continue;
            }

            // Info fields
            // X: start of tune
            if (line0 == 'X') {
                // start tune logic
                // sav.cfmt = clone(cfmt); ...
                parse.state = 1;
                continue;
            }

            // T: title
            // K: key (ends header)
            if (line0 == 'K') {
                parse.state = 2; // in tune
                this.abc.parser.new_key(file.slice(bol + 2, eol).trim());
                continue;
            }

            // ... other fields
        }

    }
}
