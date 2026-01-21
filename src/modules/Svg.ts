// abc2svg - Svg module
import { Abc } from '../Abc';
import * as abc2svg from '../abc2svg';

export class Svg {
    abc: Abc;

    // Output buffers
    output: string = "";
    style: string = '\n.stroke{stroke:currentColor;fill:none}\
\n.bW{stroke:currentColor;fill:none;stroke-width:1}\
\n.bthW{stroke:currentColor;fill:none;stroke-width:3}\
\n.slW{stroke:currentColor;fill:none;stroke-width:.7}\
\n.slthW{stroke:currentColor;fill:none;stroke-width:1.5}\
\n.sltnW{stroke:currentColor;fill:none;stroke-width:.25}\
\n.sldW{stroke:currentColor;fill:none;stroke-width:.7;stroke-dasharray:5,10}\
\n.sW{stroke:currentColor;fill:none;stroke-width:.7}\
\n.box{outline:1px solid black;outline-offset:1px}';
    font_style: string = "";
    defs: string = "";
    fulldefs: string = "";

    // State
    posx: number = 0;
    posy: number = 0;
    img: any = {
        width: 0,
        lm: 0,
        rm: 0,
        wx: 0,
        chg: 1
    };
    stv_g: any = {
        scale: 1,
        stsc: 1,
        vsc: 1,
        dy: 0,
        st: -1,
        v: -1,
        g: 0,
        started: false
    };
    blkdiv: number = 0;
    defined_glyph: any = {};
    glyphs: any = {};

    // Music font glyphs (tgls)
    tgls: any = {
        "mtr ": { x: 0, y: 0, c: "\u0020" },
        brace: { x: 0, y: 0, c: "\ue000" },
        // ... (truncated for brevity, would serve full list in real impl)
        // Adding a few key ones for basic functionality:
        tclef: { x: -8, y: 0, c: "\ue050" },
        bclef: { x: -8, y: 0, c: "\ue062" },
        note: { x: 0, y: 0, c: "\ue0a4" } // Placeholder
    };

    constructor(abc: Abc) {
        this.abc = abc;
        // Initialize posx, img based on abc.cfmt/user options if available
    }

    // Output functions
    out_svg(str: string) {
        this.output += str;
    }

    sx(x: number): number {
        if (this.stv_g.g) return x;
        return (x + this.posx) / this.stv_g.scale;
    }

    sy(y: number): number {
        if (this.stv_g.g) return -y;
        if (this.stv_g.scale == 1) return this.posy - y;
        if (this.stv_g.v >= 0) return (this.stv_g.dy - y) / this.stv_g.vsc;
        return this.stv_g.dy - y;
    }

    sh(h: number): number {
        if (this.stv_g.st < 0) return h / this.stv_g.scale;
        return h;
    }

    ax(x: number): number { return x + this.posx; }

    ay(y: number): number {
        if (this.stv_g.st < 0) return this.posy - y;
        return this.posy + (this.stv_g.dy - y) * this.stv_g.scale - this.stv_g.dy;
    }

    ah(h: number): number {
        if (this.stv_g.st < 0) return h;
        return h * this.stv_g.scale;
    }

    out_sxsy(x: number, sep: string, y: number) {
        this.output += this.sx(x).toFixed(1) + sep + this.sy(y).toFixed(1);
    }

    xypath(x: number, y: number, fill?: boolean) {
        // needs out_XYAB implementation
        this.out_XYAB(fill ? '<path d="mX Y' : '<path class="stroke" d="mX Y', x, y);
    }

    out_XYAB(str: string, x: number, y: number, a?: any, b?: any) {
        let sx = this.sx(x);
        let sy = this.sy(y);
        this.output += str.replace(/X|Y|A|B|F|G/g, (c) => {
            switch (c) {
                case 'X': return sx.toFixed(1);
                case 'Y': return sy.toFixed(1);
                case 'A': return a;
                case 'B': return b;
                case 'F': return a.toFixed(1);
                default: return typeof b === 'number' ? b.toFixed(1) : b;
            }
        });
    }

    glout() {
        // Simplified buffer flush logic
        // In real port, handle 'gla' array logic
    }

    svg_flush() {
        // Logic to assemble final SVG string
        // Use this.abc.user.img_out(...)
    }

    blk_flush() {
        this.svg_flush();
        if (this.blkdiv < 0 && !this.abc.parse.state) {
            if (this.abc.user.img_out) this.abc.user.img_out('</div>');
            this.blkdiv = 0;
        }
    }
}
