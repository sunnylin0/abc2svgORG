// abc2svg - Format module
import type { Abc } from '../Abc';
import { C } from '../abc2svg';
import { musicfont } from './font';

export class Format {
	abc: Abc;
	constructor(abc: Abc) {
		this.abc = abc;

		this.abc.cfmt = this.initFormat();
	}
	initFormat() {
		let font_scale_tb = {
			serif: 1,
			serifBold: 1,
			'sans-serif': 1,
			'sans-serifBold': 1,
			Palatino: 1.1,
			monospace: 1,
		},
			txt_ff = 'text,serif', // text font-family (serif for compatibility)
			ff = {}, // font-face's from %%beginsvg
			fmt_lock = {};

		return {
			'abc-version': '1', // default: old version
			annotationfont: { name: 'text,sans-serif', size: 12 },
			aligncomposer: 1,
			beamslope: 0.4, // max slope of a beam
			//	botmargin: .7 * IN,		// != 1.8 * CM,
			bardef: {
				'[': '', // invisible
				'[]': '',
				'|:': '[|:',
				'|::': '[|::',
				'|:::': '[|:::',
				':|': ':|]',
				'::|': '::|]',
				':::|': ':::|]',
				'::': ':][:',
			},
			breaklimit: 0.7,
			breakoneoln: true,
			cancelkey: true,
			composerfont: { name: txt_ff, style: 'italic', size: 14 },
			composerspace: 6,
			//	contbarnb: false,
			decoerr: true,
			dynalign: true,
			footerfont: { name: txt_ff, size: 16 },
			fullsvg: '',
			gchordfont: { name: 'text,sans-serif', size: 12 },
			gracespace: new Float32Array([6, 8, 11]), // left, inside, right
			graceslurs: true,
			headerfont: { name: txt_ff, size: 16 },
			historyfont: { name: txt_ff, size: 16 },
			hyphencont: true,
			indent: 0,
			infofont: { name: txt_ff, style: 'italic', size: 14 },
			infoname:
				'R "Rhythm: "\n\
                B "Book: "\n\
                S "Source: "\n\
                D "Discography: "\n\
                N "Notes: "\n\
                Z "Transcription: "\n\
                H "History: "',
			infospace: 0,
			keywarn: true,
			leftmargin: 1.4 * C.CM,
			lineskipfac: 1.1,
			linewarn: true,
			maxshrink: 0.65, // nice scores
			maxstaffsep: 2000,
			maxsysstaffsep: 2000,
			measrepnb: 1,
			measurefont: { name: txt_ff, style: 'italic', size: 10 },
			measurenb: -1,
			musicfont: { name: 'music', src: musicfont, size: 24 },
			musicspace: 6,
			//	notespacingfactor: "1.3, 38",
			partsfont: { name: txt_ff, size: 15 },
			parskipfac: 0.4,
			partsspace: 8,
			//	pageheight: 29.7 * CM,
			pagewidth: 21 * C.CM,
			'propagate-accidentals': 'o', // octave
			printmargin: 0,
			rightmargin: 1.4 * C.CM,
			rbmax: 4,
			rbmin: 2,
			repeatfont: { name: txt_ff, size: 9 },
			scale: 1,
			slurheight: 1.0,
			// spacing table (see "notespacingfactor" and set_space())
			spatab: new Float32Array([
				// default = "1.3, 38"
				10.2, 13.3, 17.3, 22.48, 29.2, 38, 49.4, 64.2, 83.5, 108.5,
			]),
			staffsep: 46,
			stemheight: 21, // one octave
			stretchlast: 0.25,
			stretchstaff: true,
			subtitlefont: { name: txt_ff, size: 16 },
			subtitlespace: 3,
			sysstaffsep: 34,
			systnames: -1, // (for compatibility)
			systvoices: 3,
			tempofont: { name: txt_ff, weight: 'bold', size: 12 },
			textfont: { name: txt_ff, size: 16 },
			//	textoption: undefined,
			textspace: 14,
			tieheight: 1.0,
			titlefont: { name: txt_ff, size: 20 },
			//	titleleft: false,
			titlespace: 6,
			titletrim: true,
			//	transp: 0,			// global transpose
			//	topmargin: .7 * IN,
			topspace: 22,
			tuplets: [0, 0, 0, 0],
			tupletfont: { name: txt_ff, style: 'italic', size: 10 },
			vocalfont: { name: txt_ff, weight: 'bold', size: 13 },
			vocalspace: 10,
			voicefont: { name: txt_ff, weight: 'bold', size: 13 },
			//	voicescale: 1,
			writefields: 'CMOPQsTWw',
			wordsfont: { name: txt_ff, size: 16 },
			wordsspace: 5,
			'writeout-accidentals': 'n',
		};
	}
	function get_bool(param) {
	return !param || !/^(0|n|f)/i.test(param); // accept void as true !
}

// %%font <font> [<encoding>] [<scale>]
function get_font_scale(param) {
	var i,
		font,
		a = info_split(param); // a[0] = font name

	if (a.length <= 1) return;
	var scale = +a[a.length - 1];

	if (isNaN(scale) || scale <= 0.5) {
		syntax(1, 'Bad scale value in %%font');
		return;
	}
	font_scale_tb[a[0]] = scale;
}

// set the width factor of a font
function set_font_fac(font) {
	var scale = font_scale_tb[font.fname || font.name];

	if (!scale) scale = 1.1;
	font.swfac = font.size * scale;
}

// %%xxxfont fontname|* [encoding] [size|*]
function param_set_font(xxxfont, p) {
	var font, n, a, ft2, k;

	// "setfont-<n>" goes to "u<n>font"
	if (xxxfont[xxxfont.length - 2] == '-') {
		n = xxxfont[xxxfont.length - 1];
		if (n < '1' || n > '9') return;
		xxxfont = 'u' + n + 'font';
	}

	// fill the values
	font = {};
	a = p.match(/\s+(no)?box(\s|$)/);
	if (a) {
		// if box
		if (a[1]) {
			font.box = false; // nobox
			font.pad = 0;
		} else {
			font.box = true;
			font.pad = 2.5;
		}
		p = p.replace(a[0], a[2]);
	}
	a = p.match(/\s+padding=([\d.]+)(\s|$)/);
	if (a) {
		// if padding
		font.pad = a[1] ? +a[1] : 0;
		p = p.replace(a[0], a[2]);
	}

	a = p.match(/\s+class=(.*?)(\s|$)/);
	if (a) {
		font.class = a[1];
		p = p.replace(a[0], a[2]);
	}
	a = p.match(/\s+wadj=(.*?)(\s|$)/);
	if (a) {
		if (typeof document == 'undefined')
			// useless if in browser
			switch (a[1]) {
				case 'none':
					font.wadj = '';
					break;
				case 'space':
					font.wadj = 'spacing';
					break;
				case 'glyph':
					font.wadj = 'spacingAndGlyphs';
					break;
				default:
					syntax(1, errs.bad_val, '%%' + xxxfont);
					break;
			}
		p = p.replace(a[0], a[2]);
	}

	// the font size is the last item
	a = p.match(/\s+([0-9.]+|\*)$/);
	if (a) {
		if (a[1] != '*') font.size = +a[1];
		p = p.replace(a[0], '');
	}

	// accept local(..) and url(...) as the font source
	if (
		(p[0] == 'u' && p.slice(0, 4) == 'url(') ||
		(p[0] == 'l' && p.slice(0, 6) == 'local(')
	) {
		n = p.indexOf(')', 1);
		if (n < 0) {
			syntax(1, 'No end of url in font family');
			return;
		}

		font.src = p.slice(0, n + 1);
		font.fid = abc2svg.font_tb.length;
		abc2svg.font_tb.push(font);
		font.name = 'ft' + font.fid;
		p = p.replace(font.src, '');
	}

	// extract the font attributes
	a = p.match(/[- ]?[nN]ormal/);
	if (a) {
		font.normal = true;
		p = p.replace(a[0], '');
	}

	// font weight
	a = p.match(abc2svg.ft_re);
	if (a) {
		font.weight = abc2svg.ft_w[a[0].replace(/[ -]/, '').toLowerCase()];
		p = p.replace(a[0], '');
	}

	a = p.match(/[- ]?[iI]talic/);
	if (a) {
		font.style = 'italic';
		p = p.replace(a[0], '');
	}
	a = p.match(/[- ]?[oO]blique/);
	if (a) {
		font.style = 'oblique';
		p = p.replace(a[0], '');
	}

	if (!font.src) {
		// if no url(...)

		// here is the font family
		p = p.trim();

		if (p == '*') p = '';
		p = p
			.replace(/Times-Roman|Times/, 'serif')
			.replace('Helvetica', 'sans-serif')
			.replace('Courier', 'monospace')
			.replace('music', cfmt.musicfont.name);
		//hack: the font "Figurato" is used for figured bass
		if (p.indexOf('Fig') > 0) font.figb = true;
	}
	if (p && !font.name) font.name = p;

	if (font.size) set_font_fac(font);

	// keep the previous attributes if no font name or no size
	if (!font.name || !font.size) {
		ft2 = cfmt[xxxfont];
		for (k in ft2) {
			if (!ft2.hasOwnProperty(k) || font[k] != undefined) continue;
			switch (k) {
				case 'fid':
				case 'used':
				case 'src':
					break;
				case 'style':
				case 'weight':
					if (font.normal) break;
				// fall thru
				default:
					font[k] = ft2[k];
					break;
			}
		}
		if (!font.swfac) set_font_fac(font);
	}
	if (font.pad == undefined) font.pad = 0;
	font.fname = font.name;
	if (font.weight >= 700) font.fname += 'Bold';

	cfmt[xxxfont] = font;
}
// get a length with a unit - return the number of pixels
get_unit(param: string): number {
	let v_match = param.toLowerCase().match(/(-?[\d.]+)(.*)/);
	if (!v_match)
		return NaN;

	let val = +v_match[1];
	switch (v_match[2]) {
		case "cm":
			return val * C.CM;
		case "in":
			return val * C.IN;
		case "pt":		// paper point in 1/72 inch
			return val / .75;
		case "px":		// screen pixel in 1/96 inch
		case "":
			return val;
	}
	return NaN;
}
// set the name of an info or a part
function set_infoname(cmd, param) {
	//fixme: check syntax: '<letter> ["string"]'
	var tmp = cfmt[cmd] ? cfmt[cmd].split('\n') : '',
		letter = param[0];

	for (var i = 0; i < tmp.length; i++) {
		var infoname = tmp[i];
		if (infoname[0] != letter) continue;
		if (param.length == 1) tmp.splice(i, 1);
		else tmp[i] = param;
		cfmt[cmd] = tmp.join('\n');
		return;
	}
	if (cfmt[cmd]) cfmt[cmd] += '\n' + param;
	else cfmt[cmd] = param;
}
// set the page layout (margin, width)
set_page() {
	let img = this.abc.img;
	let cfmt = this.abc.cfmt;

	if (!img.chg)
		return;

	img.chg = false;
	img.lm = cfmt.leftmargin - cfmt.printmargin;
	if (img.lm < 0)
		img.lm = 0;

	img.rm = cfmt.rightmargin - cfmt.printmargin;
	if (img.rm < 0)
		img.rm = 0;

	img.width = cfmt.pagewidth - 2 * cfmt.printmargin;

	// must have 100pt at least as the staff width
	if (img.width - img.lm - img.rm < 100) {
		// this.abc.error(0, undefined, "Bad staff width"); // warning
		img.width = img.lm + img.rm + 150;
	}

	// this.abc.set_posx(); // TODO: check if set_posx is needed here (it is in original)
}

// set/unset the fields to write
set_writefields(parm: string) {
	let c, i,
		a = parm.split(/\s+/);

	// helper for get_bool
	const get_bool = (p: string) => /^(1|true|yes|on)$/i.test(p);

	if (get_bool(a[1])) {
		for (i = 0; i < a[0].length; i++) {	// set
			c = a[0][i];
			if (this.abc.cfmt.writefields.indexOf(c) < 0)
				this.abc.cfmt.writefields += c;
		}
	} else {
		for (i = 0; i < a[0].length; i++) {	// unset
			c = a[0][i];
			if (this.abc.cfmt.writefields.indexOf(c) >= 0)
				this.abc.cfmt.writefields = this.abc.cfmt.writefields.replace(c, '');
		}
	}
}

// set text option
get_textopt(v: string) {
	let textopt: any = {
		align: 'j',
		center: 'c',
		fill: 'f',
		justify: 'j',
		obeylines: 'l',
		ragged: 'f',
		right: 'r',
		skip: 's',
		// abcm2ps compatibility
		"0": 'l',
		"1": 'j',
		"2": 'f',
		"3": 'c',
		"4": 's',
		"5": 'r'
	};
	let i = v.indexOf(' ');
	if (i > 0)
		v = v.slice(0, i);
	return textopt[v];
}

// set a format parameter (main entry point)
set_format(cmd: string, param: string) {
	let f, v, i;
	let cfmt = this.abc.cfmt;
	let img = this.abc.img;

	//fixme: should check the type and limits of the parameter values
	if (/.+font(-[\d])?$/.test(cmd)) {
		if (cmd == "soundfont")
			cfmt.soundfont = param;
		else
			this.param_set_font(cmd, param);
		return;
	}

	// duplicate the global parameters if already used by symbols
	// if (this.abc.sfmt[cmd] && this.abc.parse.ufmt) // Logic to handle ufmt cloning
	//    this.abc.cfmt = Object.create(this.abc.cfmt)

	switch (cmd) {
		case "aligncomposer":
		case "barsperstaff":
		case "infoline":
		case "measurenb":
		case "rbmax":
		case "rbmin":
		case "measrepnb":
		case "shiftunison":
		case "systnames":
		case "systvoices":
			v = parseInt(param);
			if (isNaN(v)) {
				// syntax error
				break;
			}
			if (cmd == "systnames") {	// compatibility
				switch (v) {
					case -1: v = 3; break;
					case 1: v = 2; break;
					case 2: v = 1; break;
				}
				cmd = "systvoices";
			}
			cfmt[cmd] = v;
			break;
		case "abc-version":
		case "bgcolor":
		case "fgcolor":
		case "propagate-accidentals":
		case "writeout-accidentals":
			cfmt[cmd] = param;
			break;
		case "beamslope":
		case "breaklimit":			// float values
		case "lineskipfac":
		case "maxshrink":
		case "pagescale":
		case "parskipfac":
		case "scale":
		case "slurheight":
		case "stemheight":
		case "tieheight":
			f = +param;
			if (isNaN(f) || !param || f < 0) {
				// syntax error
				break;
			}
			switch (cmd) {
				case "scale":			// old scale
					f /= .75;
				// fallthru
				case "pagescale":
					if (f < .1)
						f = .1;		// smallest scale
					cmd = "scale";
					img.chg = true;
					break;
			}
			cfmt[cmd] = f;
			break;
		// ... more cases (gutter, indent, margins, etc.)
		case "botmargin":
		case "composerspace":
		case "gutter":
		case "indent":
		case "leftmargin":
		case "musicspace":
		case "checkmargin": // printmargin
		case "rightmargin":
		case "staffsep":
		case "staffwidth": // pagewidth
		case "subtitlespace":
		case "sysstaffsep": // maxstaffsep
		case "textspace":
		case "titlespace":
		case "topmargin":
		case "topspace":
		case "vocalspace":
		case "wordsspace":
			// alias handling
			if (cmd == "staffwidth") cmd = "pagewidth";
			if (cmd == "checkmargin") cmd = "printmargin";
			if (cmd == "sysstaffsep") cmd = "maxstaffsep";

			f = this.get_unit(param);
			if (isNaN(f)) {
				// syntax error
				break;
			}
			cfmt[cmd] = f;
			if (cmd == "pagewidth"
				|| cmd == "leftmargin"
				|| cmd == "rightmargin"
				|| cmd == "printmargin") {
				img.chg = true;
			}
			break;

		// ... other cases
		case "writefields":
			this.set_writefields(param);
			break;
	}
}

// set a font parameter
param_set_font(cmd: string, p: string) {
	// ... (simplified logic)
	// this.abc.set_font_fac(font) // call helper
}

set_font_fac(font: any) {
	// ...
}
}
