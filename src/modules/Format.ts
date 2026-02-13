// abc2svg - Format module
import { Abc, nil } from '../Abc';
import * as abc2svg from '../abc2svg';
import { C } from '../abc2svg';
import { Amusic, Aparser, Adeco, Adraw, Asvg, Asubs, Atune, Aformat, Afront, Alyrics, Agchord } from '../Store';
import { musicfont } from './font';
let abc: Abc;
export class Format {
	font_scale_tb: any = {};
	constructor(abc_: Abc) {
		abc = abc_;

		abc.cfmt = this.initFormat();
	}
	initFormat() {
		this.font_scale_tb = {
			serif: 1,
			serifBold: 1,
			'sans-serif': 1,
			'sans-serifBold': 1,
			Palatino: 1.1,
			monospace: 1,
		};
		let txt_ff = 'text,serif', // text font-family (serif for compatibility)
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
	get_bool(param) {
		return !param || !/^(0|n|f)/i.test(param) // accept void as true !
	}

	// %%font <font> [<encoding>] [<scale>]
	get_font_scale(param) {
		var i,
			font,
			a = info_split(param); // a[0] = font name

		if (a.length <= 1) return;
		var scale = +a[a.length - 1];

		if (isNaN(scale) || scale <= 0.5) {
			abc.syntax(1, 'Bad scale value in %%font');
			return;
		}
		this.font_scale_tb[a[0]] = scale;
	}

	// set the width factor of a font
	set_font_fac(font) {
		var scale = this.font_scale_tb[font.fname || font.name];

		if (!scale) scale = 1.1;
		font.swfac = font.size * scale;
	}

	// %%xxxfont fontname|* [encoding] [size|*]
	param_set_font(xxxfont, p) {
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
						abc.syntax(1, errs.bad_val, '%%' + xxxfont);
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
				abc.syntax(1, 'No end of url in font family');
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
				.replace('music', abc.cfmt.musicfont.name);
			//hack: the font "Figurato" is used for figured bass
			if (p.indexOf('Fig') > 0) font.figb = true;
		}
		if (p && !font.name) font.name = p;

		if (font.size) this.set_font_fac(font);

		// keep the previous attributes if no font name or no size
		if (!font.name || !font.size) {
			ft2 = abc.cfmt[xxxfont];
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
			if (!font.swfac) this.set_font_fac(font);
		}
		if (font.pad == undefined) font.pad = 0;
		font.fname = font.name;
		if (font.weight >= 700) font.fname += 'Bold';

		abc.cfmt[xxxfont] = font;
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
	set_infoname(cmd, param) {
		//fixme: check syntax: '<letter> ["string"]'
		var tmp = abc.cfmt[cmd] ? abc.cfmt[cmd].split('\n') : '',
			letter = param[0];

		for (var i = 0; i < tmp.length; i++) {
			var infoname = tmp[i];
			if (infoname[0] != letter) continue;
			if (param.length == 1) tmp.splice(i, 1);
			else tmp[i] = param;
			abc.cfmt[cmd] = tmp.join('\n');
			return;
		}
		if (abc.cfmt[cmd]) abc.cfmt[cmd] += '\n' + param;
		else abc.cfmt[cmd] = param;
	}
	// get the text option
	textopt = {
		align: 'j',
		center: 'c',
		fill: 'f',
		justify: 'j',
		obeylines: 'l',
		ragged: 'f',
		right: 'r',
		skip: 's',
		// abcm2ps compatibility
		0: 'l',
		1: 'j',
		2: 'f',
		3: 'c',
		4: 's',
		5: 'r',
	};
	// set text option
	get_textopt(v: string) {
		let i = v.indexOf(' ');
		if (i > 0)
			v = v.slice(0, i);
		return this.textopt[v];
	}

	/* -- position of a voice element -- */
	posval = {
		above: C.SL_ABOVE,
		auto: 0, // !! not C.SL_AUTO !!
		below: C.SL_BELOW,
		down: C.SL_BELOW,
		hidden: C.SL_HIDDEN,
		opposite: C.SL_HIDDEN,
		under: C.SL_BELOW,
		up: C.SL_ABOVE,
	};
	/* -- set the position of elements in a voice -- */
	set_pos(k, v) {
		// keyword, value
		k = k.slice(0, 3);
		if (k == 'ste') k = 'stm';
		this.set_v_param('pos', '"' + k + ' ' + v + '"');
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
				if (abc.cfmt.writefields.indexOf(c) < 0)
					abc.cfmt.writefields += c;
			}
		} else {
			for (i = 0; i < a[0].length; i++) {	// unset
				c = a[0][i];
				if (abc.cfmt.writefields.indexOf(c) >= 0)
					abc.cfmt.writefields = abc.cfmt.writefields.replace(c, '');
			}
		}
	}


	// set a voice specific parameter
	set_v_param(k, v) {
		k = [k + '=', v];
		if (abc.parse.state < 3) Aparser.memo_kv_parm(abc.curvoice ? abc.curvoice.id : '*', k);
		else if (abc.curvoice) set_kv_parm(k);
		else Aparser.memo_kv_parm('*', k);
	}

	set_page() {
		if (!abc.img.chg) return;
		abc.img.chg = false;
		abc.img.lm = abc.cfmt.leftmargin - abc.cfmt.printmargin;
		if (abc.img.lm < 0) abc.img.lm = 0;
		abc.img.rm = abc.cfmt.rightmargin - abc.cfmt.printmargin;
		if (abc.img.rm < 0) abc.img.rm = 0;
		abc.img.width = abc.cfmt.pagewidth - 2 * abc.cfmt.printmargin;

		// must have 100pt at least as the staff width
		if (abc.img.width - abc.img.lm - abc.img.rm < 100) {
			abc.error(0, undefined, 'Bad staff width');
			abc.img.width = abc.img.lm + abc.img.rm + 150;
		}
		set_posx();
	} // set_page()

	// set a format parameter
	// (possible hook)
	public set_format(cmd, param) {
		var f, f2, v, i;

		//fixme: should check the type and limits of the parameter values
		if (/.+font(-[\d])?$/.test(cmd)) {
			if (cmd == 'soundfont') abc.cfmt.soundfont = param;
			else param_set_font(cmd, param);
			return;
		}

		// duplicate the global parameters if already used by symbols
		if (sfmt[cmd] && abc.parse.ufmt) cfmt = Object.create(cfmt);

		switch (cmd) {
			case 'aligncomposer':
			case 'barsperstaff':
			case 'infoline':
			case 'measurenb':
			case 'rbmax':
			case 'rbmin':
			case 'measrepnb':
			case 'shiftunison':
			case 'systnames':
			case 'systvoices':
				v = parseInt(param);
				if (isNaN(v)) {
					abc.syntax(1, 'Bad integer value');
					break;
				}
				if (cmd == 'systnames') {
					// compatibility
					switch (v) {
						case -1:
							v = 3;
							break;
						case 1:
							v = 2;
							break;
						case 2:
							v = 1;
							break;
					}
					cmd = 'systvoices';
				}
				abc.cfmt[cmd] = v;
				break;
			case 'abc-version':
			case 'bgcolor':
			case 'fgcolor':
			case 'propagate-accidentals':
			case 'writeout-accidentals':
				abc.cfmt[cmd] = param;
				break;
			case 'beamslope':
			case 'breaklimit': // float values
			case 'lineskipfac':
			case 'maxshrink':
			case 'pagescale':
			case 'parskipfac':
			case 'scale':
			case 'slurheight':
			case 'stemheight':
			case 'tieheight':
				f = +param;
				if (isNaN(f) || !param || f < 0) {
					abc.syntax(1, errs.bad_val, '%%' + cmd);
					break;
				}
				switch (cmd) {
					case 'scale': // old scale
						f /= 0.75;
					case 'pagescale':
						if (f < 0.1) f = 0.1; // smallest scale
						cmd = 'scale';
						abc.img.chg = true;
						break;
				}
				abc.cfmt[cmd] = f;
				break;
			case 'annotationbox':
			case 'gchordbox':
			case 'measurebox':
			case 'partsbox':
				param_set_font(
					cmd.replace('box', 'font'), // font
					'* * ' + (get_bool(param) ? 'box' : 'nobox'),
				);
				break;
			case 'altchord':
			case 'bstemdown':
			case 'breakoneoln':
			case 'cancelkey':
			case 'checkbars':
			case 'contbarnb':
			case 'custos':
			case 'decoerr':
			case 'flatbeams':
			case 'graceslurs':
			case 'graceword':
			case 'hyphencont':
			case 'keywarn':
			case 'linewarn':
			case 'squarebreve':
			case 'splittune':
			case 'straightflags':
			case 'stretchstaff':
			case 'timewarn':
			case 'titlecaps':
			case 'titleleft':
			case 'trimsvg':
				abc.cfmt[cmd] = get_bool(param);
				break;
			case 'dblrepbar':
				param = ':: ' + param;
			// fall thru
			case 'bardef': // %%bardef oldbar newbar
				v = param.split(/\s+/);
				if (v.length != 2) {
					abc.syntax(1, errs.bad_val, '%%bardef');
				} else {
					if (abc.parse.ufmt) abc.cfmt.bardef = Object.create(abc.cfmt.bardef); // new object
					abc.cfmt.bardef[v[0]] = v[1];
				}
				break;
			case 'chordalias':
				v = param.split(/\s+/);
				if (!v.length) abc.syntax(1, errs.bad_val, '%%chordalias');
				else abc2svg.ch_alias[v[0]] = v[1] || '';
				break;
			case 'composerspace':
			case 'indent':
			case 'infospace':
			case 'maxstaffsep':
			case 'maxsysstaffsep':
			case 'musicspace':
			case 'partsspace':
			case 'staffsep':
			case 'subtitlespace':
			case 'sysstaffsep':
			case 'textspace':
			case 'titlespace':
			case 'topspace':
			case 'vocalspace':
			case 'wordsspace':
				f = get_unit(param); // normally, unit in points - 72 DPI accepted
				if (isNaN(f) || f < 0) abc.syntax(1, errs.bad_val, '%%' + cmd);
				else abc.cfmt[cmd] = f;
				break;
			case 'page-format':
				user.page_format = get_bool(param);
				break;
			case 'print-leftmargin': // to remove
				abc.syntax(0, '$1 is deprecated - use %%printmargin instead', '%%' + cmd);
				cmd = 'printmargin';
			// fall thru
			case 'printmargin':
			//	case "botmargin":
			case 'leftmargin':
			//	case "pageheight":
			case 'pagewidth':
			case 'rightmargin':
				//	case "topmargin":
				f = get_unit(param); // normally unit in cm or in - 96 DPI
				if (isNaN(f)) {
					abc.syntax(1, errs.bad_val, '%%' + cmd);
					break;
				}
				abc.cfmt[cmd] = f;
				abc.img.chg = true;
				break;
			case 'concert-score':
				if (abc.cfmt.sound != 'play') abc.cfmt.sound = get_bool(param) ? 'concert' : null;
				break;
			case 'writefields':
				set_writefields(param);
				break;
			case 'volume':
				cmd = 'dynamic';
			// fall thru
			case 'dynamic':
			case 'gchord':
			case 'gstemdir':
			case 'ornament':
			case 'stemdir':
			case 'vocal':
				set_pos(cmd, param);
				break;
			case 'font':
				get_font_scale(param);
				break;
			case 'fullsvg':
				if (abc.parse.state != 0) {
					abc.syntax(1, errs.not_in_tune, '%%fullsvg');
					break;
				}
				//fixme: should check only alpha, num and '_' characters
				abc.cfmt[cmd] = param;
				break;
			case 'gracespace':
				v = param.split(/\s+/);
				for (i = 0; i < 3; i++)
					if (isNaN(+v[i])) {
						abc.syntax(1, errs.bad_val, '%%gracespace');
						break;
					}
				if (abc.parse.ufmt) abc.cfmt[cmd] = new Float32Array(3);
				for (i = 0; i < 3; i++) abc.cfmt[cmd][i] = +v[i];
				break;
			case 'tuplets':
				v = param.split(/\s+/);
				f = v[3];
				if (f)
					// if 'where'
					f = posval[f]; // translate the keyword
				if (f) v[3] = f;
				if (abc.curvoice) abc.curvoice.tup = v;
				else abc.cfmt[cmd] = v;
				break;
			case 'infoname':
			case 'partname':
				set_infoname(cmd, param);
				break;
			case 'notespacingfactor':
				v = param.match(/([.\d]+)[,\s]*(\d+)?/);
				if (v) {
					f = +v[1];
					if (isNaN(f) || f < 1 || f > 2) {
						f = 0;
					} else if (v[2]) {
						f2 = +v[2];
						if (isNaN(f)) f = 0;
					} else {
						f2 = abc.cfmt.spatab[5];
					}
				}
				if (!f) {
					abc.syntax(1, errs.bad_val, '%%' + cmd);
					break;
				}
				abc.cfmt[cmd] = param; // (for dump)

				// in the table 'spatab',
				// the width of notes is indexed by log2(note_length)
				abc.cfmt.spatab = new Float32Array(10);
				i = 5; // index of crotchet
				do {
					abc.cfmt.spatab[i] = f2;
					f2 /= f;
				} while (--i >= 0);
				i = 5;
				f2 = abc.cfmt.spatab[i];
				for (; ++i < abc.cfmt.spatab.length;) {
					f2 *= f;
					abc.cfmt.spatab[i] = f2;
				}
				break;
			case 'play':
				abc.cfmt.sound = 'play'; // without clef
				break;
			case 'pos':
				cmd = param.match(/(\w*)\s+(.*)/);
				if (!cmd || !cmd[2]) {
					abc.syntax(1, 'Error in %%pos');
					break;
				}
				if (
					cmd[1].slice(0, 3) == 'tup' && // special case for %%pos tuplet
					abc.curvoice
				) {
					// inside tune
					if (!abc.curvoice.tup) abc.curvoice.tup = abc.cfmt.tuplets;
					else abc.curvoice.tup = Object.create(abc.curvoice.tup);
					v = posval[cmd[2]];
					switch (v) {
						case C.SL_ABOVE:
							abc.curvoice.tup[3] = 1;
							break;
						case C.SL_BELOW:
							abc.curvoice.tup[3] = 2;
							break;
						case C.SL_HIDDEN:
							abc.curvoice.tup[2] = 1;
							break;
					}
					break;
				}
				if (cmd[1].slice(0, 3) == 'vol') cmd[1] = 'dyn'; // compatibility
				set_pos(cmd[1], cmd[2]);
				break;
			case 'sounding-score':
				if (abc.cfmt.sound != 'play')
					abc.cfmt.sound = get_bool(param) ? 'sounding' : null;
				break;
			case 'staffwidth':
				v = get_unit(param);
				if (isNaN(v)) {
					abc.syntax(1, errs.bad_val, '%%' + cmd);
					break;
				}
				if (v < 100) {
					abc.syntax(1, '%%staffwidth too small');
					break;
				}
				v = abc.cfmt.pagewidth - v - abc.cfmt.leftmargin;
				if (v < 2) {
					abc.syntax(1, '%%staffwidth too big');
					break;
				}
				abc.cfmt.rightmargin = v;
				abc.img.chg = true;
				break;
			case 'textoption':
				abc.cfmt[cmd] = get_textopt(param);
				break;
			case 'dynalign':
			case 'quiet':
			case 'singleline':
			case 'stretchlast':
			case 'titletrim':
				v = param == '' ? 1 : +param;
				if (isNaN(v)) v = +get_bool(param);
				if (cmd[1] == 't') {
					// stretchlast
					if (v < 0 || v > 1) {
						abc.syntax(1, errs.bad_val, '%%' + cmd);
						break;
					}
				}
				abc.cfmt[cmd] = v;
				break;
			case 'combinevoices':
				abc.syntax(1, '%%combinevoices is deprecated - use %%voicecombine instead');
				break;
			case 'voicemap':
				this.set_v_param('map', param);
				break;
			case 'voicescale':
				this.set_v_param('scale', param);
				break;
			case 'unsizedsvg':
				if (get_bool(param)) user.imagesize = '';
				else delete user.imagesize;
				break;
			// deprecated
			case 'rbdbstop':
				v = get_bool(param);
				if (v && abc.cfmt['abc-version'] >= '2.2') abc.cfmt['abc-version'] = '1';
				else if (!v && abc.cfmt['abc-version'] < '2.2') abc.cfmt['abc-version'] = '2.2';
				break;
			default: // memorize all global commands
				if (!abc.parse.state)
					// (needed for modules)
					abc.cfmt[cmd] = param;
				break;
		}

		// check if already a same format
		if (sfmt[cmd] && abc.parse.ufmt) {
			// to do...
			abc.parse.ufmt = false;
		}
	};

	// font stuff

	// build a font style
	st_font(font) {
		var n = font.name,
			r = '';

		if (font.weight) r += font.weight + ' ';
		if (font.style) r += font.style + ' ';
		if (n.indexOf('"') < 0 && n.indexOf(' ') > 0) n = '"' + n + '"';
		return r + font.size.toFixed(1) + 'px ' + n;
	}
	public style_font(font) {
		return 'font:' + this.st_font(font);
	}


	// build a font class
	font_class(font) {
		var f = 'f' + font.fid + abc.cfmt.fullsvg;
		if (font.class) f += ' ' + font.class;
		if (font.box) f += ' ' + 'box';
		return f;
	}

	// use the font
	use_font(font) {
		if (!font.used) {
			font.used = true;
			if (font.fid == undefined) {
				// if default font
				font.fid = abc2svg.font_tb.length;
				abc2svg.font_tb.push(font);
				if (!font.swfac) this.set_font_fac(font);
				if (!font.pad) font.pad = 0;
			}

			// set the pointer to the width of the characters
			if (!font.cw_tb) {
				font.cw_tb = !font.name
					? ssw_tb
					: font.name.indexOf('ans') > 0
						? ssw_tb // sans-serif
						: font.name.indexOf('ono') > 0
							? mw_tb // monospace
							: sw_tb; // serif
			}
			add_fstyle(
				'.f' + font.fid + (abc.cfmt.fullsvg || '') + '{' + this.style_font(font) + '}',
			);
			if (font.src)
				add_fstyle(
					'@font-face{\n\
 font-family:' +
					font.name +
					';\n\
 src:' +
					font.src +
					'}',
				);
			if (font == abc.cfmt.musicfont)
				// add more music font style
				add_fstyle(
					'.f' + font.fid + (abc.cfmt.fullsvg || '') + ' text,tspan{white-space:pre}',
				);
			if (ff.text && !ff.used && font.name.indexOf('text') >= 0) {
				font_style += ff.text; // add font-face's from %%beginsvg
				ff.used = 1; //true
			}
		}
	}

	// get the font of the 'xxxfont' parameter
	get_font(fn) {
		var font, font2, fid, st;

		fn += 'font';
		font = abc.cfmt[fn];
		if (!font) {
			abc.syntax(1, 'Unknown font $1', fn);
			return abc.music.gene.curfont;
		}

		if (!font.name || !font.size) {
			// if incomplete user font
			font2 = Object.create(gene.deffont);
			if (font.name) font2.name = font.name;
			if (font.normal) {
				if (font2.weight)
					// !! don't use delete !!
					font2.weight = null;
				if (font2.style) font2.style = null;
			}
			if (font.weight) font2.weight = font.weight;
			if (font.style) font2.style = font.style;
			if (font.src) font2.src = font.src;
			if (font.size) font2.size = font.size;
			st = this.st_font(font2);
			if (font.class) {
				font2.class = font.class;
				st += ' ' + font.class;
			}
			fid = abc2svg.font_st[st];
			if (fid != undefined) return abc2svg.font_tb[fid];
			abc2svg.font_st[st] = abc2svg.font_tb.length; // will be the font id
			font2.fid = font2.used = undefined;
			font = font2;
		}
		this.use_font(font);
		return font;
	}





}
