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

    // output the list of glyphs and the stems
    // [0] = x glyph
    // [1] = y glyph
    // [2] = glyph code
    // [3] = x, y, h of stem (3 values per stem)
    gla = [[], [], "", [], [], []]

    // decorations with string
    deco_str_style = {
        crdc: {				// cresc., decresc., dim., ...
            dx: 0,
            dy: 5,
            style: 'font:italic 14px text,serif',
            anchor: ' text-anchor="middle"'
        },
        dacs: {				// long repeats (da capo, fine...)
            dx: 0,
            dy: 3,
            style: 'font:bold 15px text,serif',
            anchor: ' text-anchor="middle"'
        },
        pf: {
            dx: 0,
            dy: 5,
            style: 'font:italic bold 16px text,serif',
            anchor: ' text-anchor="middle"'
        },
        at: {}
    }

    deco_val_tb = {
        arp: out_arp,
        cresc: out_cresc,
        dim: out_dim,
        ltr: out_ltr,
        lped: function (x, y, val, defl) {
            self.out_lped(x, y, val, defl)
        },
        "8va": out_8va,
        "8vb": out_8vb,
        "15ma": out_15ma,
        "15mb": out_15mb
    }

    deco_l_tb = {
        glisq: out_glisq,
        gliss: out_gliss
    }

    constructor(abc: Abc) {
        this.abc = abc;
        this.deco_str_style.at = this.deco_str_style.crdc;

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
        if (fill)
            this.out_XYAB('<path d="mX Y', x, y)
        else
            this.out_XYAB('<path class="stroke" d="mX Y', x, y)
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
    // draw all the helper/ledger lines
    draw_all_hl() {
        var st, p_st

        function hlud(hla, d) {
            var hl, hll, i, xp, dx2, x2,
                n = hla.length

            if (!n)
                return
            for (i = 0; i < n; i++) {	// for all lines
                hll = hla[i]
                if (!hll || !hll.length)
                    continue
                xp = sx(hll[0][0])	// previous x
                output +=
                    '<path class="stroke" stroke-width="1" d="M' +
                    xp.toFixed(1) + ' ' +
                    sy(p_st.y + d * i).toFixed(1)
                dx2 = 0
                while (1) {
                    hl = hll.shift()
                    if (!hl)
                        break
                    x2 = sx(hl[0])
                    output += 'm' +
                        (x2 - xp + hl[1] - dx2).toFixed(2) +
                        ' 0h' + (-hl[1] + hl[2]).toFixed(2)
                    xp = x2
                    dx2 = hl[2]
                }
                output += '"/>\n'
            }
        } // hlud()

        for (st = 0; st <= nstaff; st++) {
            p_st = staff_tb[st]
            if (!p_st.hlu)
                continue	// (staff not yet displayed)
            set_sscale(st)
            hlud(p_st.hlu, 6)
            hlud(p_st.hld, -6)
        }
    } // draw_all_hl()

    glout() {
        var e,
            v = []

        // glyphs (notes, accidentals...)
        if (gla[0].length) {
            while (1) {
                e = gla[0].shift()
                if (e == undefined)
                    break
                v.push(e.toFixed(1))
            }
            output += '<text x="' + v.join(',')

            v = []
            while (1) {
                e = gla[1].shift()
                if (e == undefined)
                    break
                v.push(e.toFixed(1))
            }
            output += '"\ny="' + v.join(',')

            output += '"\n>' + gla[2] + '</text>\n'
            gla[2] = ""
        }

        // stems
        if (!gla[3].length)
            return
        output += '<path class="sW" d="'
        while (1) {
            e = gla[3].shift()
            if (e == undefined)
                break
            output += 'M' + e.toFixed(1) +
                ' ' + gla[3].shift().toFixed(1) +
                'v' + gla[3].shift().toFixed(1)
        }
        output += '"/>\n'
    } // glout()

    // output a glyph
    xygl(x, y, gl) {
        // (avoid ps<->js loop)
        //	if (psxygl(x, y, gl))
        //		return
        if (glyphs[gl]) {
            def_use(gl)
            out_XYAB('<use x="X" y="Y" xlink:href="#A"/>\n', x, y, gl)
        } else {
            var tgl = tgls[gl]
            if (tgl) {
                x += tgl.x * stv_g.scale;
                y -= tgl.y
                if (tgl.sc) {
                    out_XYAB('<text transform="translate(X,Y) scale(A)">B</text>\n',
                        x, y, tgl.sc, tgl.c);
                } else {
                    //				out_XYAB('<text x="X" y="Y">A</text>\n', x, y, tgl.c)
                    gla[0].push(sx(x))
                    gla[1].push(sy(y))
                    gla[2] += tgl.c
                }
            } else if (gl != 'nil') {
                error(1, null, 'no definition of $1', gl)
            }
        }
    }
    // - specific functions -
    // gua gda (acciaccatura)
    out_acciac(x, y, dx, dy, up) {
        if (up) {
            x -= 1;
            y += 4
        } else {
            x -= 5;
            y -= 4
        }
        out_XYAB('<path class="stroke" d="mX YlF G"/>\n',
            x, y, dx, -dy)
    }
    // staff system brace
    out_brace(x, y, h) {
        //fixme: '-6' depends on the scale
        x += posx - 6;
        y = posy - y;
        h /= 24;
        output += '<text transform="translate(' +
            x.toFixed(1) + ',' + y.toFixed(1) +
            ') scale(2.5,' + h.toFixed(2) +
            ')">' + tgls.brace.c + '</text>\n'
    }

    // staff system bracket
    out_bracket(x, y, h) {
        x += posx - 5;
        y = posy - y - 3;
        h += 2;
        output += '<path d="m' + x.toFixed(1) + ' ' + y.toFixed(1) + '\n\
    c10.5 1 12 -4.5 12 -3.5c0 1 -3.5 5.5 -8.5 5.5\n\
    v' + h.toFixed(1) + '\n\
    c5 0 8.5 4.5 8.5 5.5c0 1 -1.5 -4.5 -12 -3.5"/>\n'
    }
    // hyphen
    out_hyph(x, y, w) {
        var n, a_y,
            d = 25 + ((w / 20) | 0) * 3

        if (w > 15.)
            n = ((w - 15) / d) | 0
        else
            n = 0;
        x += (w - d * n - 5) / 2;
        out_XYAB('<path class="stroke" stroke-width="1.2"\n\
    stroke-dasharray="5,A"\n\
    d="mX YhB"/>\n',
            x, y + 4,		// set the line a bit upper
            Math.round((d - 5) / stv_g.scale), d * n + 5)
    }
    // stem [and flags]
    out_stem(x, y, h, grace,
        nflags, straight) {	// optional
        //fixme: dx KO with half note or longa
        var dx = grace ? GSTEM_XOFF : 3.5,
            slen = -h

        if (h < 0)
            dx = -dx;		// down
        x += dx * stv_g.scale
        if (stv_g.v >= 0)
            slen /= voice_tb[stv_g.v].scale;
        gla[3].push(sx(x))
        gla[3].push(sy(y))
        gla[3].push(slen)
        if (!nflags)
            return

        y += h
        if (h > 0) {				// up
            if (!straight) {
                if (!grace) {
                    xygl(x, y, "flu" + nflags)
                    return
                } else {		// grace
                    output += '<path d="'
                    if (nflags == 1) {
                        out_XYAB('MX Yc0.6 3.4 5.6 3.8 3 10\n\
    1.2 -4.4 -1.4 -7 -3 -7\n', x, y)
                    } else {
                        while (--nflags >= 0) {
                            out_XYAB('MX Yc1 3.2 5.6 2.8 3.2 8\n\
    1.4 -4.8 -2.4 -5.4 -3.2 -5.2\n', x, y);
                            y -= 3.5
                        }
                    }
                }
            } else {			// straight
                output += '<path d="'
                if (!grace) {
                    while (--nflags >= 0) {
                        out_XYAB('MX Yl7 3.2 0 3.2 -7 -3.2z\n',
                            x, y);
                        y -= 5.4
                    }
                } else {		// grace
                    while (--nflags >= 0) {
                        out_XYAB('MX Yl3 1.5 0 2 -3 -1.5z\n',
                            x, y);
                        y -= 3
                    }
                }
            }
        } else {				// down
            if (!straight) {
                if (!grace) {
                    xygl(x, y, "fld" + nflags)
                    return
                } else {		// grace
                    output += '<path d="'
                    if (nflags == 1) {
                        out_XYAB('MX Yc0.6 -3.4 5.6 -3.8 3 -10\n\
    1.2 4.4 -1.4 7 -3 7\n', x, y)
                    } else {
                        while (--nflags >= 0) {
                            out_XYAB('MX Yc1 -3.2 5.6 -2.8 3.2 -8\n\
    1.4 4.8 -2.4 5.4 -3.2 5.2\n', x, y);
                            y += 3.5
                        }
                    }
                }
            } else {			// straight
                output += '<path d="'
                if (!grace) {
                    while (--nflags >= 0) {
                        out_XYAB('MX Yl7 -3.2 0 -3.2 -7 3.2z\n',
                            x, y);
                        y += 5.4
                    }
                    //			} else {		// grace
                    //--fixme: error?
                }
            }
        }
        output += '"/>\n'
    }
    // tremolo
    out_trem(x, y, ntrem) {
        out_XYAB('<path d="mX Y\n\t', x - 4.5, y)
        while (1) {
            output += 'l9 -3v3l-9 3z'
            if (--ntrem <= 0)
                break
            output += 'm0 5.4'
        }
        output += '"/>\n'
    }
    // tuplet bracket - the staves are not defined
    out_tubr(x, y, dx, dy, up) {
        var h = up ? -3 : 3;

        y += h;
        dx /= stv_g.scale;
        output += '<path class="stroke" d="m';
        out_sxsy(x, ' ', y);
        output += 'v' + h.toFixed(1) +
            'l' + dx.toFixed(1) + ' ' + (-dy).toFixed(1) +
            'v' + (-h).toFixed(1) + '"/>\n'
    }
    // tuplet bracket with number - the staves are not defined
    out_tubrn(x, y, dx, dy, up, str) {
        var dxx,
            sw = str.length * 10,
            h = up ? -3 : 3;

        set_font("tuplet")
        xy_str(x + dx / 2, y + dy / 2 - gene.curfont.size * .1,
            str, 'c')
        dx /= stv_g.scale
        if (!up)
            y += 6;
        output += '<path class="stroke" d="m';
        out_sxsy(x, ' ', y);
        dxx = dx - sw + 1
        if (dy > 0)
            sw += dy / 8
        else
            sw -= dy / 8
        output += 'v' + h.toFixed(1) +
            'm' + dx.toFixed(1) + ' ' + (-dy).toFixed(1) +
            'v' + (-h).toFixed(1) + '"/>\n' +
            '<path class="stroke" stroke-dasharray="' +
            (dxx / 2).toFixed(1) + ' ' + sw.toFixed(1) +
            '" d="m';
        out_sxsy(x, ' ', y - h);
        output += 'l' + dx.toFixed(1) + ' ' + (-dy).toFixed(1) + '"/>\n'

    }
    // underscore line
    out_wln(x, y, w) {
        out_XYAB('<path class="stroke" stroke-width="0.8" d="mX YhF"/>\n',
            x, y + 1, w)
    }

    out_deco_str(x, y, de) {
        var name = de.dd.glyph			// class

        if (name == 'fng') {
            out_XYAB('\
<text x="X" y="Y" style="font-size:14px">A</text>\n',
                x - 2, y + 1, m_gl(de.dd.str))
            return
        }

        if (name == '@') {			// compatibility
            name = 'at'
        } else if (!/^[A-Za-z][A-Za-z\-_]*$/.test(name)) {
            error(1, de.s, "No function for decoration '$1'", de.dd.name)
            return
        }

        var f,
            a_deco = deco_str_style[name]

        if (!a_deco)
            a_deco = deco_str_style.crdc	// default style
        else if (a_deco.style)
            style += "\n." + name + "{" + a_deco.style + "}",
                delete a_deco.style

        x += a_deco.dx;
        y += a_deco.dy;
        out_XYAB('<text x="X" y="Y" class="A"B>', x, y,
            name, a_deco.anchor || "");
        set_font("annotation");
        out_str(de.dd.str)
        output += '</text>\n'
    }

    out_arp(x, y, val) {
        g_open(x, y, 270);
        x = 0;
        val = Math.ceil(val / 6)
        while (--val >= 0) {
            xygl(x, 6, "ltr");
            x += 6
        }
        g_close()
    }
    out_cresc(x, y, val, defl) {
        x += val * stv_g.scale
        val = -val;
        out_XYAB('<path class="stroke"\n\
    d="mX YlF ', x, y, val)
        if (defl.nost)
            output += '-2.2m0 -3.6l' + (-val).toFixed(1) + ' -2.2"/>\n'
        else
            output += '-4l' + (-val).toFixed(1) + ' -4"/>\n'

    }
    out_dim(x, y, val, defl) {
        out_XYAB('<path class="stroke"\n\
    d="mX YlF ', x, y, val)
        if (defl.noen)
            output += '-2.2m0 -3.6l' + (-val).toFixed(1) + ' -2.2"/>\n'
        else
            output += '-4l' + (-val).toFixed(1) + ' -4"/>\n'
    }
    out_ltr(x, y, val) {
        y += 4;
        val = Math.ceil(val / 6)
        while (--val >= 0) {
            xygl(x, y, "ltr");
            x += 6
        }
    }
    public out_lped(x, y, val, defl) {
        if (!defl.nost)
            xygl(x, y, "ped");
        if (!defl.noen)
            xygl(x + val + 6, y, "pedoff")
    }
    out_8va(x, y, val, defl) {
        if (val < 18) {
            val = 18
            x -= 4
        }
        if (!defl.nost) {
            out_XYAB('<text x="X" y="Y" \
style="font:italic bold 12px text,serif">8\
<tspan dy="-4" style="font-size:10px">va</tspan></text>\n',
                x - 8, y);
            x += 12;
            val -= 12
        }
        y += 6;
        out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
            x, y, val)
        if (!defl.noen)
            out_XYAB('<path class="stroke" d="mX Yv6"/>\n', x + val, y)
    }
    out_8vb(x, y, val, defl) {
        if (val < 18) {
            val = 18
            x -= 4
        }
        if (!defl.nost) {
            out_XYAB('<text x="X" y="Y" \
style="font:italic bold 12px text,serif">8\
<tspan dy=".5" style="font-size:10px">vb</tspan></text>\n',
                x - 8, y);
            x += 10
            val -= 10
        }
        //	y -= 2;
        out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
            x, y, val)
        if (!defl.noen)
            out_XYAB('<path class="stroke" d="mX Yv-6"/>\n', x + val, y)
    }
    out_15ma(x, y, val, defl) {
        if (val < 25) {
            val = 25
            x -= 6
        }
        if (!defl.nost) {
            out_XYAB('<text x="X" y="Y" \
style="font:italic bold 12px text,serif">15\
<tspan dy="-4" style="font-size:10px">ma</tspan></text>\n',
                x - 10, y);
            x += 20;
            val -= 20
        }
        y += 6;
        out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
            x, y, val)
        if (!defl.noen)
            out_XYAB('<path class="stroke" d="mX Yv6"/>\n', x + val, y)
    }
    out_15mb(x, y, val, defl) {
        if (val < 24) {
            val = 24
            x -= 5
        }
        if (!defl.nost) {
            out_XYAB('<text x="X" y="Y" \
style="font:italic bold 12px text,serif">15\
<tspan dy=".5" style="font-size:10px">mb</tspan></text>\n',
                x - 10, y);
            x += 18
            val -= 18
        }
        //	y -= 2;
        out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
            x, y, val)
        if (!defl.noen)
            out_XYAB('<path class="stroke" d="mX Yv-6"/>\n', x + val, y)
    }

    out_deco_val(x, y, name, val, defl) {
        if (deco_val_tb[name])
            deco_val_tb[name](x, y, val, defl)
        else
            error(1, null, "No function for decoration '$1'", name)
    }

    out_glisq(x2, y2, de) {
        var ar, a, len,
            de1 = de.start,
            x1 = de1.x,
            y1 = de1.y + staff_tb[de1.st].y,
            dx = x2 - x1,
            dy = self.sh(y1 - y2)

        if (!stv_g.g)
            dx /= stv_g.scale

        ar = Math.atan2(dy, dx)
        a = ar / Math.PI * 180
        len = (dx - (de1.s.dots ? 13 + de1.s.xmx : 8)
            - 8 - (de.s.notes[0].shac || 0))
            / Math.cos(ar)

        g_open(x1, y1, a);
        x1 = de1.s.dots ? 13 + de1.s.xmx : 8;
        len = len / 6 | 0
        if (len < 1)
            len = 1
        while (--len >= 0) {
            xygl(x1, 0, "ltr");
            x1 += 6
        }
        g_close()
    }

    out_gliss(x2, y2, de) {
        var ar, a, len,
            de1 = de.start,
            x1 = de1.x,
            y1 = de1.y + staff_tb[de1.st].y,
            dx = x2 - x1,
            dy = self.sh(y1 - y2)

        if (!stv_g.g)
            dx /= stv_g.scale

        ar = Math.atan2(dy, dx)
        a = ar / Math.PI * 180
        len = (dx - (de1.s.dots ? 13 + de1.s.xmx : 8)
            - 8 - (de.s.notes[0].shac || 0))
            / Math.cos(ar)

        g_open(x1, y1, a);
        xypath(de1.s.dots ? 13 + de1.s.xmx : 8, 0)
        output += 'h' + len.toFixed(1) + '" stroke-width="1"/>\n';
        g_close()
    }

    out_deco_long(x, y, de) {
        var s, p_v, m, nt, i,
            name = de.dd.glyph,
            de1 = de.start

        if (!deco_l_tb[name]) {
            error(1, null, "No function for decoration '$1'", name)
            return
        }

        // if no start or no end, get the y offset of the other end
        p_v = de.s.p_v				// voice
        if (de.defl.noen) {			// if no end
            s = p_v.s_next			// start of the next music line
            while (s && !s.dur)
                s = s.next
            if (s) {
                for (m = 0; m <= s.nhd; m++) {
                    nt = s.notes[m]
                    if (!nt.a_dd)
                        continue
                    for (i = 0; i < nt.a_dd.length; i++) {
                        if (nt.a_dd[i].name == de.dd.name) {
                            y = 3 * (nt.pit - 18)
                                + staff_tb[de.s.st].y
                            break
                        }
                    }
                }
            }
            x += 8				// (there is no note width)
        } else if (de.defl.nost) {		// no start
            s = p_v.s_prev			// end of the previous music line
            while (s && !s.dur)
                s = s.prev
            if (s) {
                for (m = 0; m <= s.nhd; m++) {
                    nt = s.notes[m]
                    if (!nt.a_dd)
                        continue
                    for (i = 0; i < nt.a_dd.length; i++) {
                        if (nt.a_dd[i].name == de1.dd.name) {
                            de1.y = 3 * (nt.pit - 18)
                            break
                        }
                    }
                }
            }
            de1.x -= 8			// (there is no note width)
        }
        deco_l_tb[name](x, y, de)
    }

    // add a tempo note in 'str' and return its number of characters
    tempo_note(str, s, dur, dy) {
        var p,
            elts = identify_note(s, dur)

        switch (elts[0]) {		// head
            case C.OVAL:
                p = "\ueca2"
                break
            case C.EMPTY:
                p = "\ueca3"
                break
            default:
                switch (elts[2]) {	// flags
                    case 2:
                        p = "\ueca9"
                        break
                    case 1:
                        p = "\ueca7"
                        break
                    default:
                        p = "\ueca5"
                        break
                }
                break
        }
        str.push('<tspan\nclass="' +
            font_class(cfmt.musicfont) +
            '" style="font-size:' +
            (gene.curfont.size * 1.3).toFixed(1) + 'px"' +
            dy + '>' +
            p + '</tspan>'
            + (elts[1] ? '\u2009.' : ''))		// dot
        return elts[1] ? 2 : 1
    } // tempo_note()

    // build the tempo string
    tempo_build(s) {
        var i, j, bx, p, wh, dy, h,
            w = 0,
            str = []

        if (s.tempo_str)	// already done
            return

        // the music font must be defined
        if (!cfmt.musicfont.used)
            get_font("music")

        set_font("tempo")
        h = gene.curfont.size
        if (s.tempo_str1) {
            str.push(s.tempo_str1)
            w += strwh(s.tempo_str1)[0]
        }
        if (s.tempo_notes) {
            dy = ' dy="-1"'			// notes a bit higher
            h *= 1.3
            for (i = 0; i < s.tempo_notes.length; i++) {
                j = tempo_note(str, s, s.tempo_notes[i], dy)
                w += j * gene.curfont.swfac
                dy = ''
            }
            str.push('<tspan dy="1">=</tspan>')
            w += cwidf('=')
            if (s.tempo_ca) {
                str.push(s.tempo_ca)
                w += strwh(s.tempo_ca)[0]
                j = s.tempo_ca.length + 1
            }
            if (s.tempo) {			// with a number of beats per minute
                str.push(s.tempo)
                w += strwh(s.tempo.toString())[0]
            } else {			// with a beat as a note
                j = tempo_note(str, s, s.new_beat, ' dy="-1"')
                w += j * gene.curfont.swfac
                dy = 'y'
            }
        }
        if (s.tempo_str2) {
            if (dy)
                str.push('<tspan\n\tdy="1">' +
                    s.tempo_str2 + '</tspan>')
            else
                str.push(s.tempo_str2)
            w += strwh(s.tempo_str2)[0]
        }

        // build the string
        s.tempo_str = str.join(' ')
        w += cwidf(' ') * (str.length - 1)
        s.tempo_wh = [w, h]
    } // tempo_build()

    // output a tempo
    writempo(s, x, y) {
        var bh

        set_font("tempo")
        if (gene.curfont.box) {
            gene.curfont.box = false
            bh = s.tempo_wh[1] + 2
        }

        //fixme: xy_str() cannot be used because <tspan> in s.tempo_str
        //fixme: then there cannot be font changes by "$n" in the Q: texts
        output += '<text class="' + font_class(gene.curfont) +
            '" x="'
        out_sxsy(x, '" y="', y + gene.curfont.size * .22)
        output += '">' + s.tempo_str + '</text>\n'

        if (bh) {
            gene.curfont.box = true
            output += '<rect class="stroke" x="'
            out_sxsy(x - 2, '" y="', y + bh - 1)
            output += '" width="' + (s.tempo_wh[0] + 4).toFixed(1) +
                '" height="' + bh.toFixed(1) +
                '"/>\n'
        }

        // don't display anymore
        s.invis = true
    } // writempo()

    // update the vertical offset
    vskip(h) {
        posy += h
    }

    // clear the styles
    clr_sty() {
        font_style = ''
        if (cfmt.fullsvg) {
            defined_glyph = {}
            for (var i = 0; i < abc2svg.font_tb.length; i++)
                abc2svg.font_tb[i].used = 0 //false
            ff.used = 0 //false		// clear the font-face
        } else {
            style =
                fulldefs = ''
        }
    } // clr_sty()

    // create the SVG image of the block
    svg_flush() {
        if (multicol || !user.img_out || posy == 0)
            return

        var i, font,
            fmt = tsnext ? tsnext.fmt : cfmt,
            w = Math.ceil((fmt.trimsvg || fmt.singleline == 1)
                ? (cfmt.leftmargin + img.wx * cfmt.scale + cfmt.rightmargin + 2)
                : img.width),
            head = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
    xmlns:xlink="http://www.w3.org/1999/xlink"\n\
    fill="currentColor" stroke-width=".7"',
            g = ''

        glout()

        if (cfmt.fgcolor)
            head += ' color="' + cfmt.fgcolor + '"'
        font = get_font("music")
        head += ' class="' + font_class(font) +
            ' tune' + tunes.length + '"\n'	// tune index for play

        posy *= cfmt.scale
        if (user.imagesize != undefined)
            head += user.imagesize
        else
            head += ' width="' + w
                + 'px" height="' + posy.toFixed(2) + 'px"'
        head += ' viewBox="0 0 ' + w + ' '
            + posy.toFixed(2) + '">\n'
        head += fulldefs
        if (cfmt.bgcolor)
            head += '<rect width="100%" height="100%" fill="'
                + cfmt.bgcolor + '"/>\n'

        if (style || font_style)
            head += '<style>' + font_style + style + '\n</style>\n'

        if (defs)
            head += '<defs>' + defs + '\n</defs>\n'

        // if %%pagescale != 1, do a global scale
        // (with a container: transform scale in <svg> does not work
        //	the same in all browsers)
        // the class is used to know that the container is global
        if (cfmt.scale != 1) {
            head += '<g class="g" transform="scale(' +
                cfmt.scale + ')">\n';
            g = '</g>\n'
        }

        if (psvg)			// if PostScript support
            psvg.ps_flush(true);	// + setg(0)

        // start a block if needed
        if (parse.state == 1 && user.page_format && !blkdiv)
            blkdiv = 1		// new tune
        if (blkdiv > 0) {
            user.img_out(blkdiv == 1 ?
                '<div class="nobrk">' :
                '<div class="nobrk newpage">')
            blkdiv = -1		// block started
        } else if (blkdiv < 0 && cfmt.splittune) {
            i = 1			// header and first music line
            blkdiv = 0
        }
        user.img_out(head + output + g + "</svg>");
        if (i)
            user.img_out("</div>")
        output = ""

        clr_sty()
        defs = '';
        posy = 0
        img.wx = 0			// space used between the margins
    }


    blk_flush() {
        this.svg_flush();
        if (this.blkdiv < 0 && !this.abc.parse.state) {
            if (this.abc.user.img_out) this.abc.user.img_out('</div>');
            this.blkdiv = 0;
        }
    }
}
