// abc2svg - Subs module
import { Abc } from '../Abc';
import * as abc2svg from '../abc2svg';

export class Subs {
    abc: Abc;

    // Font tables (simplified for initial port, should copy full tables)
    sw_tb: Float32Array;
    ssw_tb: Float32Array;
    mw_tb: Float32Array;

    font_style: string = "";

    constructor(abc: Abc) {
        this.abc = abc;

        // Initialize tables (placeholders for full data)
        this.sw_tb = new Float32Array(128);
        this.ssw_tb = new Float32Array(128);
        this.mw_tb = new Float32Array(128);
        // ... Populate tables as per original file if needed or load from a separate data file
    }

    add_fstyle(s: string) {
        this.font_style += "\n" + s;
        // In browser, also inject into document style
        if (typeof document !== 'undefined') {
            // Logic to append to document.head
        }
    }

    cwid(c: string): number {
        // Character width calculation
        return 0; // Placeholder
    }

    strwh(str: string | any): [number, number] {
        // String width/height calculation
        // This is a critical function needed by Svg module
        if (typeof str === 'object' && str.wh) return str.wh;
        return [0, 10]; // Placeholder result
    }

    out_str(str: string) {
        // Output string handling font changes
        this.abc.svg.out_svg(str); // Delegate to SVG output
    }

    xy_str(x: number, y: number, str: string, action?: string, w?: number, wh?: [number, number]) {
        // Output text at position
        // Needs proper implementation calling out_str and handling alignment
    }

    // High level text output
    put_words(words: any) {
        // Output lyrics/words
        // Calls this.abc.svg.svg_flush()
    }
}
