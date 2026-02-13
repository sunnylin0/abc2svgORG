// abc2svg - Svg module
import { Abc, nil } from '../Abc';
import * as abc2svg from '../abc2svg';
import { C } from '../abc2svg';
import { Amusic, Aparser, Adeco, Adraw, Asvg, Asubs, Atune, Aformat, Afront, Alyrics, Agchord } from '../Store';
let abc: Abc;
export class Svg {
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

	// Music font this.glyphs (this.tgls)
	tgls: any = {
		"mtr ": { x: 0, y: 0, c: "\u0020" },
		brace: { x: 0, y: 0, c: "\ue000" },
		// ... 要補起 (truncated for brevity, would serve full list in real impl)
		// Adding a few key ones for basic functionality:
		tclef: { x: -8, y: 0, c: "\ue050" },
		bclef: { x: -8, y: 0, c: "\ue062" },
		note: { x: 0, y: 0, c: "\ue0a4" } // Placeholder
	};

	// this.output the list of this.glyphs and the stems
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
		arp: this.out_arp,
		cresc: this.out_cresc,
		dim: this.out_dim,
		ltr: this.out_ltr,
		lped: function (x, y, val, defl) {
			self.out_lped(x, y, val, defl)
		},
		"8va": this.out_8va,
		"8vb": this.out_8vb,
		"15ma": this.out_15ma,
		"15mb": this.out_15mb
	}

	deco_l_tb = {
		glisq: this.out_glisq,
		gliss: this.out_gliss
	}

	constructor(abc_: Abc) {
		abc = abc_;
		this.deco_str_style.at = this.deco_str_style.crdc;
		this.anno_start = this.empty_function;
		this.anno_stop = this.empty_function;
	}

	/////////////////////////////////////////

	// convert a meter string to a SmuFL encoded string
	m_gl(s: string) {
		return s.replace(/./g,
			(e) => {
				var m = this.tgls["mtr" + e]
				//fixme: !! no m.x nor m.y yet !!
				//			if (!m.x && !m.y)
				return m ? m.c : 0
				//			return '<tspan dx="'+ m.x.toFixed(1) +
				//				'" dy="' + m.y.toFixed(1) +
				//				'">' +
				//				m.c + '</tspan>'
			})
	}

	// mark a glyph as used and add it in <defs>
	def_use(gl: string) {
		var i: number, j: number, g: string

		if (this.defined_glyph[gl])
			return
		this.defined_glyph[gl] = true;
		g = this.glyphs[gl]
		if (!g) {
			//throw new Error("unknown glyph: " + gl)
			abc.error(1, null, "Unknown glyph: '$1'", gl)
			return	// fixme: the xlink is set
		}
		j = 0
		while (1) {
			i = g.indexOf('xlink:href="#', j)
			if (i < 0)
				break
			i += 13;
			j = g.indexOf('"', i);
			def_use(g.slice(i, j))
			this.def_use(g.slice(i, j))
		}
		this.defs += '\n' + g
	}

	// add abc.user this.defs from %%beginsvg
	defs_add(text: string) {
		var i: number, j: number, gl: string, tag: string, is: number,
			ie = 0

		// remove XML comments
		text = text.replace(/<!--.*?-->/g, '')

		while (1) {
			is = text.indexOf('<', ie);
			if (is < 0)
				break
			i = text.indexOf('id="', is)
			if (i < 0)
				break
			i += 4;
			j = text.indexOf('"', i);
			if (j < 0)
				break
			gl = text.slice(i, j);
			ie = text.indexOf('>', j);
			if (ie < 0)
				break
			if (text[ie - 1] == '/') {
				ie++
			} else {
				i = text.indexOf(' ', is);
				if (i < 0)
					break
				tag = text.slice(is + 1, i);
				ie = text.indexOf('</' + tag + '>', ie)
				if (ie < 0)
					break
				ie += 3 + tag.length
			}
			if (text.substr(is, 7) == '<filter')
				this.fulldefs += text.slice(is, ie) + '\n'
			else
				this.glyphs[gl] = text.slice(is, ie)
		}
	}

	// this.output the stop/start of a graphic sequence
	set_g() {

		// close the previous sequence
		if (this.stv_g.started) {
			this.stv_g.started = false;
			this.glout()
			this.output += "</g>\n"
		}

		// check if new sequence needed
		if (this.stv_g.scale == 1 && !this.stv_g.color)
			return

		// open the new sequence
		this.glout()
		this.output += '<g '
		if (this.stv_g.scale != 1) {
			if (this.stv_g.st < 0)
				this.output += abc.voice_tb[this.stv_g.v].scale_str
			else if (this.stv_g.v < 0)
				this.output += abc.staff_tb[this.stv_g.st].scale_str
			else
				this.output += 'transform="translate(0,' +
					(this.posy - this.stv_g.dy).toFixed(1) +
					') scale(' + this.stv_g.scale + ')"'
		}
		if (this.stv_g.color) {
			if (this.stv_g.scale != 1)
				this.output += ' ';
			this.output += 'color="' + this.stv_g.color + '"'
		}
		this.output += ">\n";
		this.stv_g.started = true
	}

	/* set the color */
	set_color(color: string) {
		if (color == this.stv_g.color)
			return undefined	// same color
		var old_color = this.stv_g.color;
		this.stv_g.color = color;
		this.set_g()
		return old_color
	}

	/* -- set the staff scale (only) -- */
	set_sscale(st: number) {
		var new_scale: number, dy: number

		if (st != this.stv_g.st && this.stv_g.scale != 1)
			this.stv_g.scale = 1
		new_scale = st >= 0 ? abc.staff_tb[st].staffscale : 1
		if (st >= 0 && new_scale != 1)
			dy = abc.staff_tb[st].y
		else
			dy = this.posy
		if (new_scale == this.stv_g.scale && dy == this.stv_g.dy
			&& this.stv_g.st == st && this.stv_g.vsc == 1)
			return
		this.stv_g.stsc =
			this.stv_g.scale = new_scale
		this.stv_g.vsc = 1
		this.stv_g.dy = dy;
		this.stv_g.st = st;
		this.stv_g.v = -1;
		this.set_g()
	}

	/* -- set the voice or staff scale -- */
	set_scale(s: any) {
		var new_dy = this.posy,
			st = abc.staff_tb[s.st].staffscale == 1 ? -1 : s.st,
			new_scale = s.p_v.scale

		if (st >= 0) {
			new_scale *= abc.staff_tb[st].staffscale
			new_dy = abc.staff_tb[st].y
		}
		if (new_scale == this.stv_g.scale && this.stv_g.dy == new_dy)
			return
		this.stv_g.scale = new_scale;
		this.stv_g.vsc = s.p_v.scale
		this.stv_g.dy = new_dy;
		this.stv_g.st = st
		this.stv_g.v = s.v;
		this.set_g()
	}

	// -- set the staff this.output buffer and scale when delayed this.output
	set_dscale(st: number, no_scale?: boolean) {
		if (this.output) {
			if (this.stv_g.started) {	// close the previous sequence
				this.stv_g.started = false
				this.glout()
				this.output += "</g>\n"
			}
			if (this.stv_g.st < 0) {
				abc.staff_tb[0].output += this.output
			} else if (this.stv_g.scale == 1) {
				abc.staff_tb[this.stv_g.st].output += this.output
			} else {
				abc.staff_tb[this.stv_g.st].sc_out += this.output
			}
			this.output = ""
		}
		if (st < 0)
			this.stv_g.scale = 1
		else
			this.stv_g.scale = no_scale ? 1 : abc.staff_tb[st].staffscale;
		this.stv_g.st = st;
		this.stv_g.dy = 0
	}

	// update the y offsets of delayed this.output
	delayed_update() {
		var st: number, new_out: string, text: string

		for (st = 0; st <= abc.nstaff; st++) {
			if (abc.staff_tb[st].sc_out) {
				this.output += '<g ' + abc.staff_tb[st].scale_str + '>\n' +
					abc.staff_tb[st].sc_out = ""
			}
			if (!abc.staff_tb[st].output)
				continue
			this.output += '<g transform="translate(0,' +
				(-abc.staff_tb[st].y).toFixed(1) +
				')">\n' +
				abc.staff_tb[st].output +
				'</g>\n';
			abc.staff_tb[st].output = ""
		}
	}

	// this.output the annotations
	anno_out(s: any, t: string | undefined, f: Function) {
		if (s.istart == undefined)
			return
		var type = s.type,
			h = s.ymx - s.ymn + 4,
			wl = s.wl || 2,
			wr = s.wr || 2

		if (s.grace)
			type = C.GRACE

		f(t || abc2svg.sym_name[type], s.istart, s.iend,
			s.x - wl - 2, abc.staff_tb[s.st].y + s.ymn + h - 2,
			wl + wr + 4, h, s);
	}

	a_start(s: any, t?: string) {
		this.anno_out(s, t, abc.user.anno_start)
	}
	a_stop(s: any, t?: string) {
		this.anno_out(s, t, abc.user.anno_stop)
	}
	empty_function() {
	}
	// the values are updated on generate()
	anno_start: Function;
	anno_stop: Function;

	// this.output the stop abc.user annotations
	anno_put() {
		var s: any
		while (1) {
			s = abc.anno_a.shift()
			if (!s)
				break
			switch (s.type) {
				case C.CLEF:
				case C.METER:
				case C.KEY:
				case C.REST:
					if (s.type != C.REST || s.rep_nb) {
						this.set_sscale(s.st)
						break
					}
				// fall thru
				case C.GRACE:
				case C.NOTE:
				case C.MREST:
					this.set_scale(s)
					break
				//		default:
				//			continue
			}
			this.anno_stop(s)
		}
	}
	// open / close containers
	g_open(x: number, y: number, rot?: number, sx?: number, sy?: number) {
		this.glout()
		this.out_XYAB('<g transform="translate(X,Y', x, y);
		if (rot)
			this.output += ') rotate(' + rot.toFixed(2)
		if (sx) {
			this.output += ') scale(' + this.sx
			if (this.sy)
				this.output += ', ' + this.sy
		}
		this.output += ')">\n';
		this.stv_g.g++
	}
	g_close() {
		this.glout()
		this.stv_g.g--;
		this.output += '</g>\n'
	}

	public out_svg(str: string) {
		this.output += str;
	}
	// exported functions for the annotation
	public sx(x: number): number {
		if (this.stv_g.g) return x;
		return (x + this.posx) / this.stv_g.scale;
	}

	public sy(y: number): number {
		if (this.stv_g.g) return -y;
		if (this.stv_g.scale == 1) return this.posy - y;
		if (this.stv_g.v >= 0) return (this.stv_g.dy - y) / this.stv_g.vsc;
		return this.stv_g.dy - y; // staff scale only
	}

	public sh(h: number): number {
		if (this.stv_g.st < 0)
			return h / this.stv_g.scale;
		return h;
	}
	// for absolute X,Y coordinates
	public ax(x: number): number { return x + this.posx; }

	public ay(y: number): number {
		if (this.stv_g.st < 0)
			return this.posy - y;
		return this.posy + (this.stv_g.dy - y) * this.stv_g.scale - this.stv_g.dy;
	}

	public ah(h: number): number {
		if (this.stv_g.st < 0)
			return h;
		return h * this.stv_g.scale;
	}
	// this.output scaled (x + <sep> + y)
	public out_sxsy(x: number, sep: string, y: number) {
		this.output += this.sx(x).toFixed(1) + sep + this.sy(y).toFixed(1);
	}

	public xypath(x: number, y: number, fill?: boolean) {
		if (fill)
			this.out_XYAB('<path d="mX Y', x, y)
		else
			this.out_XYAB('<path class="stroke" d="mX Y', x, y)
	}
	// this.output a string with x, y, a and b
	out_XYAB(str: string, x: number, y: number, a?: any, b?: any) {
		let sx = this.sx(x);
		let sy = this.sy(y);
		abc.output += str.replace(/X|Y|A|B|F|G/g, (c) => {
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
		var st: number, p_st: any

		function hlud(hla: any[], d: number) {
			var hl: any, hll: any[], i: number, xp: number, dx2: number, x2: number,
				n = hla.length

			if (!n)
				return
			for (i = 0; i < n; i++) {	// for all lines
				hll = hla[i]
				if (!hll || !hll.length)
					continue
				xp = sx(hll[0][0])	// previous x
				this.output +=
					'<path class="stroke" stroke-width="1" d="M' +
					xp.toFixed(1) + ' ' +
					sy(p_st.y + d * i).toFixed(1)
				dx2 = 0
				while (1) {
					hl = hll.shift()
					if (!hl)
						break
					x2 = this.sx(hl[0])
					this.output += 'm' +
						(x2 - xp + hl[1] - dx2).toFixed(2) +
						' 0h' + (-hl[1] + hl[2]).toFixed(2)
					xp = x2
					dx2 = hl[2]
				}
				this.output += '"/>\n'
			}
		} // hlud()

		for (st = 0; st <= abc.nstaff; st++) {
			p_st = abc.staff_tb[st]
			if (!p_st.hlu)
				continue	// (staff not yet displayed)
			this.set_sscale(st)
			hlud(p_st.hlu, 6)
			hlud(p_st.hld, -6)
		}
	}

	glout() {
		var e: any,
			v: string[] = []

		// this.glyphs (notes, accidentals...)
		if (this.gla[0].length) {
			while (1) {
				e = this.gla[0].shift()
				if (e == undefined)
					break
				v.push(e.toFixed(1))
			}
			this.output += '<text x="' + v.join(',')

			v = []
			while (1) {
				e = this.gla[1].shift()
				if (e == undefined)
					break
				v.push(e.toFixed(1))
			}
			this.output += '"\ny="' + v.join(',')

			this.output += '"\n>' + this.gla[2] + '</text>\n'
			this.gla[2] = ""
		}

		// stems
		if (!this.gla[3].length)
			return
		this.output += '<path class="sW" d="'
		while (1) {
			e = this.gla[3].shift()
			if (e == undefined)
				break
			this.output += 'M' + e.toFixed(1) +
				' ' + this.gla[3].shift().toFixed(1) +
				'v' + this.gla[3].shift().toFixed(1)
		}
		this.output += '"/>\n'
	}
	// this.output a glyph
	xygl(x: number, y: number, gl: string) {
		// (avoid ps<->js loop)
		//	if (psxygl(x, y, gl))
		//		return
		if (this.glyphs[gl]) {
			this.def_use(gl)
			this.out_XYAB('<use x="X" y="Y" xlink:href="#A"/>\n', x, y, gl)
		} else {
			var tgl = this.tgls[gl]
			if (tgl) {
				x += tgl.x * this.stv_g.scale;
				y -= tgl.y
				if (tgl.sc) {
					this.out_XYAB('<text transform="translate(X,Y) scale(A)">B</text>\n',
						x, y, tgl.sc, tgl.c);
				} else {
					//				this.out_XYAB('<text x="X" y="Y">A</text>\n', x, y, tgl.c)
					this.gla[0].push(this.sx(x))
					this.gla[1].push(this.sy(y))
					this.gla[2] += tgl.c
				}
			} else if (gl != 'nil') {
				abc.error(1, null, 'no definition of $1', gl)
			}
		}
	}
	// - specific functions -
	// gua gda (acciaccatura)
	out_acciac(x: number, y: number, dx: number, dy: number, up: boolean) {
		if (up) {
			x -= 1;
			y += 4
		} else {
			x -= 5;
			y -= 4
		}
		this.out_XYAB('<path class="stroke" d="mX YlF G"/>\n',
			x, y, dx, -dy)
	}
	// staff system brace
	out_brace(x: number, y: number, h: number) {
		//fixme: '-6' depends on the scale
		x += this.posx - 6;
		y = this.posy - y;
		h /= 24;
		this.output += '<text transform="translate(' +
			x.toFixed(1) + ',' + y.toFixed(1) +
			') scale(2.5,' + h.toFixed(2) +
			')">' + this.tgls.brace.c + '</text>\n'
	}
	// staff system bracket
	out_bracket(x: number, y: number, h: number) {
		x += this.posx - 5;
		y = this.posy - y - 3;
		h += 2;
		this.output += '<path d="m' + x.toFixed(1) + ' ' + y.toFixed(1) + '\n\
    c10.5 1 12 -4.5 12 -3.5c0 1 -3.5 5.5 -8.5 5.5\n\
    v' + h.toFixed(1) + '\n\
    c5 0 8.5 4.5 8.5 5.5c0 1 -1.5 -4.5 -12 -3.5"/>\n'
	}
	// hyphen
	out_hyph(x: number, y: number, w: number) {
		var n: number, a_y: number,
			d = 25 + ((w / 20) | 0) * 3

		if (w > 15.)
			n = ((w - 15) / d) | 0
		else
			n = 0;
		x += (w - d * n - 5) / 2;
		this.out_XYAB('<path class="stroke" stroke-width="1.2"\n\
    stroke-dasharray="5,A"\n\
    d="mX YhB"/>\n',
			x, y + 4,		// set the line a bit upper
			Math.round((d - 5) / this.stv_g.scale), d * n + 5)
	}
	// stem [and flags]
	out_stem(x: number, y: number, h: number, grace: boolean,
		nflags: number, straight: boolean) {	// optional
		//fixme: dx KO with half note or longa
		var dx = grace ? C.GSTEM_XOFF : 3.5,
			slen = -h

		if (h < 0)
			dx = -dx;		// down
		x += dx * this.stv_g.scale
		if (this.stv_g.v >= 0)
			slen /= abc.voice_tb[this.stv_g.v].scale;
		this.gla[3].push(this.sx(x))
		this.gla[3].push(this.sy(y))
		this.gla[3].push(slen)
		if (!nflags)
			return

		y += h
		if (h > 0) {				// up
			if (!straight) {
				if (!grace) {
					this.xygl(x, y, "flu" + nflags)
					return
				} else {		// grace
					this.output += '<path d="'
					if (nflags == 1) {
						this.out_XYAB('MX Yc0.6 3.4 5.6 3.8 3 10\n\
    1.2 -4.4 -1.4 -7 -3 -7\n', x, y)
					} else {
						while (--nflags >= 0) {
							this.out_XYAB('MX Yc1 3.2 5.6 2.8 3.2 8\n\
    1.4 -4.8 -2.4 -5.4 -3.2 -5.2\n', x, y);
							y -= 3.5
						}
					}
				}
			} else {			// straight
				this.output += '<path d="'
				if (!grace) {
					while (--nflags >= 0) {
						this.out_XYAB('MX Yl7 3.2 0 3.2 -7 -3.2z\n',
							x, y);
						y -= 5.4
					}
				} else {		// grace
					while (--nflags >= 0) {
						this.out_XYAB('MX Yl3 1.5 0 2 -3 -1.5z\n',
							x, y);
						y -= 3
					}
				}
			}
		} else {				// down
			if (!straight) {
				if (!grace) {
					this.xygl(x, y, "fld" + nflags)
					return
				} else {		// grace
					this.output += '<path d="'
					if (nflags == 1) {
						this.out_XYAB('MX Yc0.6 -3.4 5.6 -3.8 3 -10\n\
    1.2 4.4 -1.4 7 -3 7\n', x, y)
					} else {
						while (--nflags >= 0) {
							this.out_XYAB('MX Yc1 -3.2 5.6 -2.8 3.2 -8\n\
    1.4 4.8 -2.4 5.4 -3.2 5.2\n', x, y);
							y += 3.5
						}
					}
				}
			} else {			// straight
				this.output += '<path d="'
				if (!grace) {
					while (--nflags >= 0) {
						this.out_XYAB('MX Yl7 -3.2 0 -3.2 -7 3.2z\n',
							x, y);
						y += 5.4
					}
					//			} else {		// grace
					//--fixme: error?
				}
			}
		}
		this.output += '"/>\n'
	}
	// tremolo
	out_trem(x: number, y: number, ntrem: number) {
		this.out_XYAB('<path d="mX Y\n\t', x - 4.5, y)
		while (1) {
			this.output += 'l9 -3v3l-9 3z'
			if (--ntrem <= 0)
				break
			this.output += 'm0 5.4'
		}
		this.output += '"/>\n'
	}
	// tuplet bracket - the staves are not defined
	out_tubr(x: number, y: number, dx: number, dy: number, up: boolean) {
		var h = up ? -3 : 3;

		y += h;
		dx /= this.stv_g.scale;
		this.output += '<path class="stroke" d="m';
		this.out_sxsy(x, ' ', y);
		this.output += 'v' + h.toFixed(1) +
			'l' + dx.toFixed(1) + ' ' + (-dy).toFixed(1) +
			'v' + (-h).toFixed(1) + '"/>\n'
	}
	// tuplet bracket with number - the staves are not defined
	out_tubrn(x: number, y: number, dx: number, dy: number, up: boolean, str: string) {
		var dxx: number,
			sw = str.length * 10,
			h = up ? -3 : 3;

		abc.set_font("tuplet")
		abc.xy_str(x + dx / 2, y + dy / 2 - abc.gene.curfont.size * .1,
			str, 'c')
		dx /= this.stv_g.scale
		if (!up)
			y += 6;
		this.output += '<path class="stroke" d="m';
		this.out_sxsy(x, ' ', y);
		dxx = dx - sw + 1
		if (dy > 0)
			sw += dy / 8
		else
			sw -= dy / 8
		this.output += 'v' + h.toFixed(1) +
			'm' + dx.toFixed(1) + ' ' + (-dy).toFixed(1) +
			'v' + (-h).toFixed(1) + '"/>\n' +
			'<path class="stroke" stroke-dasharray="' +
			(dxx / 2).toFixed(1) + ' ' + sw.toFixed(1) +
			'" d="m';
		this.out_sxsy(x, ' ', y - h);
		this.output += 'l' + dx.toFixed(1) + ' ' + (-dy).toFixed(1) + '"/>\n'

	}
	// underscore line
	out_wln(x: number, y: number, w: number) {
		this.out_XYAB('<path class="stroke" stroke-width="0.8" d="mX YhF"/>\n',
			x, y + 1, w)
	}

	out_deco_str(x: number, y: number, de: any) {
		var name = de.dd.glyph			// class

		if (name == 'fng') {
			this.out_XYAB('\
<text x="X" y="Y" style="font-size:14px">A</text>\n',
				x - 2, y + 1, m_gl(de.dd.str))
			return
		}

		if (name == '@') {			// compatibility
			name = 'at'
		} else if (!/^[A-Za-z][A-Za-z\-_]*$/.test(name)) {
			abc.error(1, de.s, "No function for decoration '$1'", de.dd.name)
			return
		}

		var f,
			a_deco = this.deco_str_style[name]

		if (!a_deco)
			a_deco = this.deco_str_style.crdc	// default this.style
		else if (a_deco.style)
			this.style += "\n." + name + "{" + a_deco.style + "}",
				delete a_deco.style

		x += a_deco.dx;
		y += a_deco.dy;
		this.out_XYAB('<text x="X" y="Y" class="A"B>', x, y,
			name, a_deco.anchor || "");
		abc.out_str(de.dd.str)
		this.output += '</text>\n'
	}

	out_arp(x: number, y: number, val: number) {
		this.g_open(x, y, 270);
		x = 0;
		val = Math.ceil(val / 6)
		while (--val >= 0) {
			this.xygl(x, 6, "ltr");
			x += 6
		}
		this.g_close()
	}
	out_cresc(x: number, y: number, val: number, defl: any) {
		x += val * this.stv_g.scale
		val = -val;
		this.out_XYAB('<path class="stroke"\n\
    d="mX YlF ', x, y, val)
		if (defl.nost)
			this.output += '-2.2m0 -3.6l' + (-val).toFixed(1) + ' -2.2"/>\n'
		else
			this.output += '-4l' + (-val).toFixed(1) + ' -4"/>\n'

	}
	out_dim(x: number, y: number, val: number, defl: any) {
		this.out_XYAB('<path class="stroke"\n\
    d="mX YlF ', x, y, val)
		if (defl.noen)
			this.output += '-2.2m0 -3.6l' + (-val).toFixed(1) + ' -2.2"/>\n'
		else
			this.output += '-4l' + (-val).toFixed(1) + ' -4"/>\n'
	}
	out_ltr(x: number, y: number, val: number) {
		y += 4;
		val = Math.ceil(val / 6)
		while (--val >= 0) {
			this.xygl(x, y, "ltr");
			x += 6
		}
	}
	public out_lped(x: number, y: number, val: number, defl: any) {
		if (!defl.nost)
			this.xygl(x, y, "ped");
		if (!defl.noen)
			this.xygl(x + val + 6, y, "pedoff")
	}
	out_8va(x: number, y: number, val: number, defl: any) {
		if (val < 18) {
			val = 18
			x -= 4
		}
		if (!defl.nost) {
			this.out_XYAB('<text x="X" y="Y" \
this.style="font:italic bold 12px text,serif">8\
<tspan dy="-4" style="font-size:10px">va</tspan></text>\n',
				x - 8, y);
			x += 12;
			val -= 12
		}
		y += 6;
		this.out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
			x, y, val)
		if (!defl.noen)
			this.out_XYAB('<path class="stroke" d="mX Yv6"/>\n', x + val, y)
	}
	out_8vb(x: number, y: number, val: number, defl: any) {
		if (val < 18) {
			val = 18
			x -= 4
		}
		if (!defl.nost) {
			this.out_XYAB('<text x="X" y="Y" \
this.style="font:italic bold 12px text,serif">8\
<tspan dy=".5" style="font-size:10px">vb</tspan></text>\n',
				x - 8, y);
			x += 10
			val -= 10
		}
		//	y -= 2;
		this.out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
			x, y, val)
		if (!defl.noen)
			this.out_XYAB('<path class="stroke" d="mX Yv-6"/>\n', x + val, y)
	}
	out_15ma(x: number, y: number, val: number, defl: any) {
		if (val < 25) {
			val = 25
			x -= 6
		}
		if (!defl.nost) {
			this.out_XYAB('<text x="X" y="Y" \
this.style="font:italic bold 12px text,serif">15\
<tspan dy="-4" style="font-size:10px">ma</tspan></text>\n',
				x - 10, y);
			x += 20;
			val -= 20
		}
		y += 6;
		this.out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
			x, y, val)
		if (!defl.noen)
			this.out_XYAB('<path class="stroke" d="mX Yv6"/>\n', x + val, y)
	}
	out_15mb(x: number, y: number, val: number, defl: any) {
		if (val < 24) {
			val = 24
			x -= 5
		}
		if (!defl.nost) {
			this.out_XYAB('<text x="X" y="Y" \
this.style="font:italic bold 12px text,serif">15\
<tspan dy=".5" style="font-size:10px">mb</tspan></text>\n',
				x - 10, y);
			x += 18
			val -= 18
		}
		//	y -= 2;
		this.out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
			x, y, val)
		if (!defl.noen)
			this.out_XYAB('<path class="stroke" d="mX Yv-6"/>\n', x + val, y)
	}

	out_deco_val(x: number, y: number, name: string, val: number, defl: any) {
		if (Asvg.deco_val_tb[name])
			Asvg.deco_val_tb[name](x, y, val, defl)
		else
			abc.error(1, null, "No function for decoration '$1'", name)
	}

	out_glisq(x2: number, y2: number, de: any) {
		var ar: number, a: number, len: number,
			de1 = de.start,
			x1 = de1.x,
			y1 = de1.y + abc.staff_tb[de1.st].y,
			dx = x2 - x1,
			dy = this.sh(y1 - y2)

		if (!this.stv_g.g)
			dx /= this.stv_g.scale

		ar = Math.atan2(dy, dx)
		a = ar / Math.PI * 180
		len = (dx - (de1.s.dots ? 13 + de1.s.xmx : 8)
			- 8 - (de.s.notes[0].shac || 0))
			/ Math.cos(ar)

		this.g_open(x1, y1, a);
		x1 = de1.s.dots ? 13 + de1.s.xmx : 8;
		len = len / 6 | 0
		if (len < 1)
			len = 1
		while (--len >= 0) {
			this.xygl(x1, 0, "ltr");
			x1 += 6
		}
		this.g_close()
	}

	out_gliss(x2: number, y2: number, de: any) {
		var ar: number, a: number, len: number,
			de1 = de.start,
			x1 = de1.x,
			y1 = de1.y + abc.staff_tb[de1.st].y,
			dx = x2 - x1,
			dy = this.sh(y1 - y2)

		if (!this.stv_g.g)
			dx /= this.stv_g.scale

		ar = Math.atan2(dy, dx)
		a = ar / Math.PI * 180
		len = (dx - (de1.s.dots ? 13 + de1.s.xmx : 8)
			- 8 - (de.s.notes[0].shac || 0))
			/ Math.cos(ar)

		this.g_open(x1, y1, a);
		this.xypath(de1.s.dots ? 13 + de1.s.xmx : 8, 0)
		this.output += 'h' + len.toFixed(1) + '" stroke-width="1"/>\n';
		this.g_close()
	}

	out_deco_long(x: number, y: number, de: any) {
		var s, p_v, m, nt, i,
			name = de.dd.glyph,
			de1 = de.start

		if (!this.deco_l_tb[name]) {
			abc.error(1, null, "No function for decoration '$1'", name)
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
								+ abc.staff_tb[de.s.st].y
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
		this.deco_l_tb[name](x, y, de)
	}
	// add a tempo note in 'str' and return its number of characters
	tempo_note(str: string[], s: any, dur: any, dy: string) {
		var p,
			elts = abc.identify_note(s, dur)

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
			abc.font_class(abc.cfmt.musicfont) +
			'" style="font-size:' +
			(abc.gene.curfont.size * 1.3).toFixed(1) + 'px"' +
			dy + '>' +
			p + '</tspan>'
			+ (elts[1] ? '\u2009.' : ''))		// dot
		return elts[1] ? 2 : 1
	}
	// build the tempo string
	tempo_build(s: any) {
		var i, j, bx, p, wh, dy, h,
			w = 0,
			str = []

		if (s.tempo_str)	// already done
			return

		// the music font must be defined
		if (!abc.cfmt.musicfont.used)
			abc.get_font("music")

		abc.set_font("tempo")
		h = abc.gene.curfont.size
		if (s.tempo_str1) {
			str.push(s.tempo_str1)
			w += abc.strwh(s.tempo_str1)[0]
		}
		if (s.tempo_notes) {
			dy = ' dy="-1"'			// notes a bit higher
			h *= 1.3
			for (i = 0; i < s.tempo_notes.length; i++) {
				j = this.tempo_note(str, s, s.tempo_notes[i], dy)
				w += j * abc.gene.curfont.swfac
				dy = ''
			}
			str.push('<tspan dy="1">=</tspan>')
			w += abc.cwidf('=')
			if (s.tempo_ca) {
				str.push(s.tempo_ca)
				w += abc.strwh(s.tempo_ca)[0]
				j = s.tempo_ca.length + 1
			}
			if (s.tempo) {			// with a number of beats per minute
				str.push(s.tempo)
				w += abc.strwh(s.tempo.toString())[0]
			} else {			// with a beat as a note
				j = this.tempo_note(str, s, s.new_beat, ' dy="-1"')
				w += j * abc.gene.curfont.swfac
				dy = 'y'
			}
		}
		if (s.tempo_str2) {
			if (dy)
				str.push('<tspan\n\tdy="1">' +
					s.tempo_str2 + '</tspan>')
			else
				str.push(s.tempo_str2)
			w += abc.strwh(s.tempo_str2)[0]
		}

		// build the string
		s.tempo_str = str.join(' ')
		w += abc.cwidf(' ') * (str.length - 1)
		s.tempo_wh = [w, h]
	}
	// this.output a tempo
	writempo(s: any, x: number, y: number) {
		var bh

		abc.set_font("tempo")
		if (abc.gene.curfont.box) {
			abc.gene.curfont.box = false
			bh = s.tempo_wh[1] + 2
		}

		//fixme: abc.xy_str() cannot be used because <tspan> in s.tempo_str
		//fixme: then there cannot be font changes by "$n" in the Q: texts
		this.output += '<text class="' + abc.font_class(abc.gene.curfont) +
			'" x="'
		this.out_sxsy(x, '" y="', y + abc.gene.curfont.size * .22)
		this.output += '">' + s.tempo_str + '</text>\n'

		if (bh) {
			abc.gene.curfont.box = true
			this.output += '<rect class="stroke" x="'
			this.out_sxsy(x - 2, '" y="', y + bh - 1)
			this.output += '" width="' + (s.tempo_wh[0] + 4).toFixed(1) +
				'" height="' + bh.toFixed(1) +
				'"/>\n'
		}

		// don't display anymore
		s.invis = true
	}
	// update the vertical offset
	vskip(h: number) {
		this.posy += h
	}
	// clear the styles
	clr_sty() {
		this.font_style = ''
		if (abc.cfmt.fullsvg) {
			this.defined_glyph = {}
			for (var i = 0; i < abc2svg.font_tb.length; i++)
				abc2svg.font_tb[i].used = false
			if (Aformat.ff) Aformat.ff.used = false		// clear the font-face
		} else {
			this.style =
				this.fulldefs = ''
		}
	}
	// create the SVG image of the block
	svg_flush() {
		if (abc.parser.multicol || !abc.user.img_out || this.posy == 0)
			return

		var i, font,
			fmt = Amusic.tsnext ? Amusic.tsnext.fmt : abc.cfmt,
			w = Math.ceil((fmt.trimsvg || fmt.singleline == 1)
				? (abc.cfmt.leftmargin + this.img.wx * abc.cfmt.scale + abc.cfmt.rightmargin + 2)
				: this.img.width),
			head = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
    xmlns:xlink="http://www.w3.org/1999/xlink"\n\
    fill="currentColor" stroke-width=".7"',
			g = ''

		this.glout()

		if (abc.cfmt.fgcolor)
			head += ' color="' + abc.cfmt.fgcolor + '"'
		font = abc.get_font("music")
		head += ' class="' + abc.font_class(font) +
			' tune' + abc.tunes.length + '"\n'	// tune index for play

		this.posy *= abc.cfmt.scale
		if (abc.user.imagesize != undefined)
			head += abc.user.imagesize
		else
			head += ' width="' + w
				+ 'px" height="' + this.posy.toFixed(2) + 'px"'
		head += ' viewBox="0 0 ' + w + ' '
			+ this.posy.toFixed(2) + '">\n'
		head += this.fulldefs
		if (abc.cfmt.bgcolor)
			head += '<rect width="100%" height="100%" fill="'
				+ abc.cfmt.bgcolor + '"/>\n'

		if (this.style || this.font_style)
			head += '<style>' + this.font_style + this.style + '\n</style>\n'

		if (this.defs)
			head += '<defs>' + this.defs + '\n</defs>\n'

		// if %%pagescale != 1, do a global scale
		// (with a container: transform scale in <svg> does not work
		//	the same in all browsers)
		// the class is used to know that the container is global
		if (abc.cfmt.scale != 1) {
			head += '<g class="g" transform="scale(' +
				abc.cfmt.scale + ')">\n';
			g = '</g>\n'
		}

		if (abc.psvg)			// if PostScript support
			// + setg(0)

			// start a block if needed
			if (abc.parse.state == 1 && abc.user.page_format && !this.blkdiv)
				this.blkdiv = 1		// new tune
		if (this.blkdiv > 0) {
			abc.user.img_out(this.blkdiv == 1 ?
				'<div class="nobrk">' :
				'<div class="nobrk newpage">')
			this.blkdiv = -1		// block started
		} else if (this.blkdiv < 0 && abc.cfmt.splittune) {
			i = 1			// header and first music line
			this.blkdiv = 0
		}
		if (i)
			abc.user.img_out("</div>")
		this.output = ""

		this.clr_sty()
		this.defs = '';
		this.posy = 0
		this.img.wx = 0			// space used between the margins
	}
	blk_flush() {
		this.svg_flush();
		if (this.blkdiv < 0 && !abc.parse.state) {
			if (abc.user.img_out) abc.user.img_out('</div>');
			this.blkdiv = 0;
		}
	}
}






