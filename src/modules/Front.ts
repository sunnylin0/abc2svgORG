// abc2svg - Front module (Entry point)
import { Abc, nil } from '../Abc';
import * as abc2svg from '../abc2svg';
import { C } from '../abc2svg';
import { Amusic, Aparser, Adeco, Adraw, Asvg, Asubs, Atune, Aformat, Afront, Alyrics, Agchord } from '../Store';
let abc: Abc;

export class Front {
	sav: any = {}; // save global (between tunes) definitions
	mac: any = {}; // macros (m:)
	maci: any = {}; // first letters of macros
	modone: any = {}; // hooks done by module
	include: number = 0; // ABC include
	// translation table from the ABC draft version 2.2
	abc_utf: { [key: string]: string } = {
		'=D': 'Đ',
		'=H': 'Ħ',
		'=T': 'Ŧ',
		'=d': 'đ',
		'=h': 'ħ',
		'=t': 'ŧ',
		'/O': 'Ø',
		'/o': 'ø',
		//	"/D": "Đ",
		//	"/d": "đ",
		'/L': 'Ł',
		'/l': 'ł',
		vL: 'Ľ',
		vl: 'ľ',
		vd: 'ď',
		'.i': 'ı',
		AA: 'Å',
		aa: 'å',
		AE: 'Æ',
		ae: 'æ',
		DH: 'Ð',
		dh: 'ð',
		//	"ng": "ŋ",
		OE: 'Œ',
		oe: 'œ',
		ss: 'ß',
		TH: 'Þ',
		th: 'þ',
	};

	// accidentals as octal values (abcm2ps compatibility)
	oct_acc: { [key: string]: string } = {
		1: '\u266f',
		2: '\u266d',
		3: '\u266e',
		4: '&#x1d12a;',
		5: '&#x1d12b;',
	};
	constructor(abc_: Abc) {
		abc = abc_;
	}
	// convert the escape sequences to utf-8
	cnv_escape(src: string, flag?: string) {
		var c,
			c2,
			dst = '',
			i,
			j = 0;

		while (1) {
			i = src.indexOf('\\', j);
			if (i < 0) break;
			dst += src.slice(j, i);
			c = src[++i];
			if (!c) return dst + '\\';
			switch (c) {
				case '0':
				case '2':
					if (src[i + 1] != '0') break;
					c2 = this.oct_acc[src[i + 2]];
					if (c2) {
						dst += c2;
						j = i + 3;
						continue;
					}
					break;
				case 'u':
					j = Number('0x' + src.slice(i + 1, i + 5));
					if (isNaN(j) || j < 0x20) {
						dst += src[++i] + '\u0306'; // breve accent
						j = i + 1;
						continue;
					}
					c = String.fromCharCode(j);
					if (c == '\\') {
						i += 4;
						break;
					}
					dst += c;
					j = i + 5;
					continue;
				case 't': // TAB
					dst += '\t';
					j = i + 1;
					continue;
				case 'n': // new line (voice name)
					dst += '\n';
					j = i + 1;
					continue;
				default:
					c2 = this.abc_utf[src.slice(i, i + 2)];
					if (c2) {
						dst += c2;
						j = i + 2;
						continue;
					}

					// try unicode combine characters
					c2 = src[i + 1];
					if (!c2) break; // !! the next test is true if c2 is undefined !!
					if (!/[A-Za-z]/.test(c2)) break;
					switch (c) {
						case '`':
							dst += c2 + '\u0300'; // grave
							j = i + 2;
							continue;
						case "'":
							dst += c2 + '\u0301'; // acute
							j = i + 2;
							continue;
						case '^':
							dst += c2 + '\u0302'; // circumflex
							j = i + 2;
							continue;
						case '~':
							dst += c2 + '\u0303'; // tilde
							j = i + 2;
							continue;
						case '=':
							dst += c2 + '\u0304'; // macron
							j = i + 2;
							continue;
						case '_':
							dst += c2 + '\u0305'; // overline
							j = i + 2;
							continue;
						case '.':
							dst += c2 + '\u0307'; // dot
							j = i + 2;
							continue;
						case '"':
							dst += c2 + '\u0308'; // dieresis
							j = i + 2;
							continue;
						case 'o':
							dst += c2 + '\u030a'; // ring
							j = i + 2;
							continue;
						case 'H':
							dst += c2 + '\u030b'; // hungarumlaut
							j = i + 2;
							continue;
						case 'v':
							dst += c2 + '\u030c'; // caron
							j = i + 2;
							continue;
						//			case ',':
						//				dst += c2 + "\u0326"	// comma below
						//				j = i + 2
						//				continue
						case 'c':
							dst += c2 + '\u0327'; // cedilla
							j = i + 2;
							continue;
						case ';':
							dst += c2 + '\u0328'; // ogonek
							j = i + 2;
							continue;
					}
					break;
			}
			if (flag == 'w')
				// if lyrics line (w:)
				dst += '\\'; // keep the backslash
			dst += c;
			j = i + 1;
		}
		return dst + src.slice(j);
	}


	do_include(fn: string) {
		var file, parse_sav;

		if (!abc.user.read_file) {
			abc.syntax(1, 'No read_file support');
			return;
		}
		if (this.include > 2) {
			abc.syntax(1, 'Too many include levels');
			return;
		}
		file = abc.user.read_file(fn);
		if (!file) {
			abc.syntax(1, "Cannot read file '$1'", fn);
			return;
		}
		this.include++;
		parse_sav = Abc.clone(abc.parse);
		this.tosvg(fn, file);
		parse_sav.state = abc.parse.state;
		parse_sav.ckey = abc.parse.ckey;
		abc.parse = parse_sav;
		this.include--;
	}

	// Main entry point
	tosvg(file: string, in_fname: string) {
		let cfmt = abc.cfmt;
		let info = abc.info;
		let parse = abc.parse;
		let user = abc.user;
		let sav: any = {};
		let se: number;
		let stag: any;

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
		abc.parse.line.buffer = ""; // ScanBuf
		// abc.parse.file = file; // TODO: scanbuf handles this? or we need parsing context

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
			abc.error(sev, null, msg, ...args);
		};

		// check if a tune is selected
		const tune_selected = () => {
			var re,
				res,
				i = file.indexOf('K:', bol);

			if (i < 0) {
				//			abc.syntax(1, "No K: in tune")
				return false;
			}
			i = file.indexOf('\n', i);
			if (abc.parse.select.test(file.slice(abc.parse.bol, i))) return true;
			re = /\n\w*\n/;
			re.lastIndex = i;
			res = re.exec(file);
			if (res) eol = re.lastIndex;
			else eol = eof;
			return false;
		} // tune_selected()

		// set the sequence showing the source and save it in sav.src
		const set_src = (b: string, i?: number) => {
			var r,
				t,
				etag = '';

			if (se === undefined || !se) se = file.indexOf('\n\n', bol); // end of tune
			if (se < 0) se = eof;
			if (typeof stag != 'object') {
				// set the tag after source
				if (stag[0] != 'b' && stag[0] != 'a' && stag[0] != '+' && stag[0] != '*')
					stag = 'b' + stag; // default: source before
				if (stag[1] != '<')
					// (if bool)
					stag = stag[0] + '<pre>';
				r = stag.match(/<\/?[^>]*>/g);
				while (1) {
					t = r.pop();
					if (!t) break;
					if (t[1] == '/' || t.slice(-2) == '/>')
						r.pop(); // skip this stop/start tag
					else etag += '</' + t.slice(1);
				}
				abc.cfmt.show_source = stag = [stag, etag];
			}
			t = stag[0].slice(1) + (abc as any).clean_txt(file.slice(bol, se)) + stag[1];
			if (stag[0][0] == '+' && sav.src) sav.src += t;
			else sav.src = t;
		}; // set_src()


		const end_tune = () => {
			abc.parse.bol = bol; // (for multi V:)
			abc.tune.generate();
			cfmt = sav.cfmt;
			info = sav.info;
			// char_tb = sav.char_tb; // TODO: where is char_tb? Assuming abc.parser
			// glovar = sav.glovar;
			// maps = sav.maps;
			this.mac = sav.mac;
			this.maci = sav.maci;
			(abc.parse as any).tune_v_opts = null;
			(abc.parse as any).scores = null;
			abc.parse.ufmt = false;
			delete (abc.parse as any).pq;
			abc.tune.init_tune();
			abc.img.chg = true;
			abc.format.set_page();
			if (abc.cfmt.show_source) {
				user.img_out('</div>');
				if (abc.cfmt.show_source[0][0] == 'a') user.img_out(sav.src);
			}
		}; // end_tune()

		// get %%voice
		const do_voice = (select: string, in_tune: boolean) => {
			var opt, bol;
			if (select == 'end') return; // end of previous %%voice

			// get the options
			if (in_tune) {
				if (!(abc.parse as any).tune_v_opts) (abc.parse as any).tune_v_opts = {};
				opt = (abc.parse as any).tune_v_opts;
			} else {
				if (!(abc.parse as any).voice_opts) (abc.parse as any).voice_opts = {};
				opt = (abc.parse as any).voice_opts;
			}
			opt[select] = [];
			while (1) {
				bol = ++eol;
				if (file[bol] != '%') break;
				eol = file.indexOf('\n', eol);
				if (file[bol + 1] != line1) continue;
				bol += 2;
				if (eol < 0) text = file.slice(bol);
				else text = file.slice(bol, eol);
				a = text.match(/\S+/);
				switch (a[0]) {
					default:
						opt[select].push(uncomment(text, true));
						continue;
					case 'score':
					case 'staves':
					case 'tune':
					case 'voice':
						bol -= 2;
						break;
				}
				break;
			}
			eol = abc.parse.eol = bol - 1;
		} // do_voice()

		// apply the options to the current tune
		const tune_filter = () => {
			var o,
				opts,
				j,
				pc,
				h,
				i = file.indexOf('K:', bol);

			i = file.indexOf('\n', i);
			h = file.slice(abc.parse.bol, i); // tune header

			for (i in (abc.parse as any).tune_opts) {
				if (!(abc.parse as any).tune_opts.hasOwnProperty(i)) continue;
				if (!new RegExp(i).test(h)) continue;
				opts = (abc.parse as any).tune_opts[i];
				for (j = 0; j < opts.t_opts.length; j++) {
					pc = opts.t_opts[j];
					switch (pc.match(/\S+/)[0]) {
						case 'score':
						case 'staves':
							if (!(abc.parse as any).scores) (abc.parse as any).scores = [];
							(abc.parse as any).scores.push(pc);
							break;
						default:
							abc.tune.do_pscom(pc);
							break;
					}
				}
				opts = opts.v_opts;
				if (!opts) continue;
				for (j in opts) {
					if (!opts.hasOwnProperty(j)) continue;
					if (!(abc.parse as any).tune_v_opts) (abc.parse as any).tune_v_opts = {};
					if (!(abc.parse as any).tune_v_opts[j]) (abc.parse as any).tune_v_opts[j] = opts[j];
					else (abc.parse as any).tune_v_opts[j] = (abc.parse as any).tune_v_opts[j].concat(opts[j]);
				}
			}
		} // tune_filter()



		// export functions and/or set module hooks
		if (abc2svg.mhooks) {
			for (i in abc2svg.mhooks) {
				if (!this.modone[i]) {
					this.modone[i] = 1; //true
					abc2svg.mhooks[i](this);
				}
			}
		}

		// initialize
		abc.parse.file = file; // used for errors
		abc.parse.fname = in_fname;

		// scan the file
		if (bol == undefined) bol = 0;
		if (!eof) eof = file.length;
		if (file.slice(bol, bol + 5) == '%abc-')
			abc.cfmt['abc-version'] = /[1-9.]+/.exec(file.slice(bol + 5, bol + 10));
		for (; bol < eof; bol = abc.parse.eol + 1) {
			eol = file.indexOf('\n', bol); // get a line
			if (eol < 0 || eol > eof) eol = eof;
			abc.parse.eol = eol;

			// remove the ending white spaces
			while (1) {
				eol--;
				switch (file[eol]) {
					case ' ':
					case '\t':
						continue;
				}
				break;
			}
			eol++;
			if (eol == bol) {
				// empty line
				if (abc.parse.state == 1) {
					abc.parse.istart = bol;
					abc.syntax(1, 'Empty line in tune header - ignored');
				} else if (abc.parse.state >= 2) {
					end_tune();
					abc.parse.state = 0;
					if (abc.parse.select) {
						// skip to next tune
						eol = file.indexOf('\nX:', abc.parse.eol);
						if (eol < 0) eol = eof;
						abc.parse.eol = eol;
					}
				}
				continue;
			}
			abc.parse.istart = abc.parse.bol = bol;
			abc.parse.iend = eol;
			abc.parse.line.index = 0;

			// check if the line is a pseudo-comment or I:
			line0 = file[bol];
			line1 = file[bol + 1];
			if ((line0 == 'I' && line1 == ':') || line0 == '%') {
				if (line0 == '%' && (abc.parse as any).prefix.indexOf(line1) < 0) continue; // comment

				// change "%%abc xxxx" to "xxxx"
				if (
					file[bol + 2] == 'a' &&
					file[bol + 3] == 'b' &&
					file[bol + 4] == 'c' &&
					file[bol + 5] == ' '
				) {
					bol += 6;
					line0 = file[bol];
					line1 = file[bol + 1];
				} else {
					pscom = true;
				}
			}

			// pseudo-comments
			if (pscom) {
				pscom = false;
				bol += 2; // skip %%/I:
				text = file.slice(bol, eol);
				a = text.match(/([^\s]+)\s*(.*)/);
				if (!a || a[1][0] == '%') continue;
				switch (a[1]) {
					case 'abcm2ps':
					case 'ss-pref':
						(abc.parse as any).prefix = a[2]; // may contain a '%'
						continue;
					case 'abc-include':
						do_include(uncomment(a[2]));
						continue;
				}

				// beginxxx/endxxx
				if (a[1].slice(0, 5) == 'begin') {
					b = a[1].substr(5);
					end = '\n' + line0 + line1 + 'end' + b;
					i = file.indexOf(end, eol);
					if (i < 0) {
						abc.syntax(1, 'No $1 after %%$2', end.slice(1), a[1]);
						abc.parse.eol = eof;
						continue;
					}
					abc.tune.do_begin_end(
						b,
						uncomment(a[2]),
						file
							.slice(eol + 1, i)
							.replace(/\n%[^%].*$/gm, '')
							.replace(/^%%/gm, ''),
					);
					abc.parse.eol = file.indexOf('\n', i + 6);
					if (abc.parse.eol < 0) abc.parse.eol = eof;
					continue;
				}
				switch (a[1]) {
					case 'show_source':
						b = uncomment(a[2]);
						switch (b[0]) {
							case '*':
								i = file.indexOf('\n' + line0 + line1 + 'show_source', eol);
								bol -= 2; // keep %%show_.. in the source
								set_src(b, i);
								user.img_out(sav.src);
							// fall thru
							case '0':
								b = '';
							// fall thru
							default:
								abc.cfmt[a[1]] = b;
							// fall thru
						}
						continue;
					case 'select':
						if (abc.parse.state != 0) {
							abc.syntax(1, abc.errs.not_in_tune, '%%select');
							continue;
						}
						select = uncomment(a[2]);
						if (select[0] == '"') select = select.slice(1, -1);
						if (!select) {
							delete abc.parse.select;
							continue;
						}
						select = select.replace(/\(/g, '\\(');
						select = select.replace(/\)/g, '\\)');
						//				select = select.replace(/\|/g, '\\|');
						abc.parse.select = new RegExp(select, 'm');
						continue;
					case 'tune':
						if (abc.parse.state != 0) {
							abc.syntax(1, abc.errs.not_in_tune, '%%tune');
							continue;
						}
						select = uncomment(a[2]);

						// if void %%tune, free all tune options
						if (!select) {
							(abc.parse as any).tune_opts = {};
							continue;
						}

						if (select == 'end') continue; // end of previous %%tune

						if (!(abc.parse as any).tune_opts) (abc.parse as any).tune_opts = {};
						(abc.parse as any).tune_opts[select] = opt = {
							t_opts: [],
							//						v_opts: {}
						};
						while (1) {
							bol = eol;
							if (file[bol + 1] != '%') break;
							eol = file.indexOf('\n', eol + 1);
							if (file[bol + 2] != line1) continue;
							text = file.slice(bol + 3, eol < 0 ? undefined : eol);
							a = text.match(/([^\s]+)\s*(.*)/);
							switch (a[1]) {
								case 'tune':
									break;
								case 'voice':
									do_voice(uncomment(a[2], true), true);
									continue;
								default:
									opt.t_opts.push(uncomment(text, true));
									continue;
							}
							break;
						}
						if ((abc.parse as any).tune_v_opts) {
							opt.v_opts = (abc.parse as any).tune_v_opts;
							(abc.parse as any).tune_v_opts = null;
						}
						abc.parse.eol = bol;
						continue;
					case 'voice':
						if (abc.parse.state != 0) {
							abc.syntax(1, errs.not_in_tune, '%%voice');
							continue;
						}
						select = uncomment(a[2]);

						/* if void %%voice, free all voice options */
						if (!select) {
							abc.parse.voice_opts = null;
							continue;
						}

						do_voice(select, true);
						continue;
				}
				abc.tune.do_pscom(uncomment(text, true));
				continue;
			}

			// music line (or free text)
			if (line1 != ':' || !/[A-Za-z+]/.test(line0)) {
				last_info = undefined;
				if (abc.parse.state < 2) continue;
				abc.parse.line.buffer = uncomment(file.slice(bol, eol));
				if (abc.parse.line.buffer) abc.parser.parse_music_line();
				continue;
			}

			// information fields
			bol += 2;
			while (1) {
				switch (file[bol]) {
					case ' ':
					case '\t':
						bol++;
						continue;
				}
				break;
			}
			if (line0 == '+') {
				if (!last_info) {
					abc.syntax(1, '+: without previous info field');
					continue;
				}
				txt_add = ' '; // concatenate
				line0 = last_info;
			}
			text = uncomment(file.slice(bol, eol), line0);

			switch (line0) {
				case 'X': // start of tune
					if (abc.parse.state != 0) {
						abc.syntax(1, abc.errs.ignored, line0);
						continue;
					}
					if (abc.parse.select && !tune_selected()) {
						// skip to the next tune
						eol = file.indexOf('\nX:', abc.parse.eol);
						if (eol < 0) eol = eof;
						abc.parse.eol = eol;
						continue;
					}

					sav.cfmt = Abc.clone(cfmt);
					sav.info = Abc.clone(info, 2); // (level 2 for info.V[])
					sav.char_tb = Abc.clone(abc.parser.char_tb);
					sav.glovar = Abc.clone((abc.parser as any).glovar);
					sav.maps = Abc.clone((abc.parser as any).maps, 1);
					sav.mac = Abc.clone(this.mac);
					sav.maci = Abc.clone(this.maci);
					if (abc.cfmt.show_source) {
						bol -= 2;
						set_src(abc.cfmt.show_source); // Assuming set_src handles the type
						if (abc.cfmt.show_source[0][0] == 'b') user.img_out(sav.src);
						user.img_out('<div class="source">');
					}
					info.X = text;
					abc.parse.state = 1; // tune header
					if ((abc.parse as any).tune_opts) tune_filter();
					continue;
				case 'T':
					switch (abc.parse.state) {
						case 0:
							continue;
						case 1:
						case 2:
							text = (abc as any).trim_title(text, info.T);
							if (info.T == undefined)
								// (keep empty T:)
								info.T = text;
							else info.T += '\n' + text;
							continue;
					}
					s = abc.parser.new_block('title');
					s.text = text;
					continue;
				case 'K':
					switch (abc.parse.state) {
						case 0:
							continue;
						case 1: // tune header
							info.K = text;
							break;
					}
					abc.parser.do_info(line0, text);
					continue;
				case 'W':
					if (abc.parse.state == 0 || abc.cfmt.writefields.indexOf(line0) < 0) break;
					if (info.W == undefined) info.W = text;
					else info.W += txt_add + text;
					break;

				case 'm':
					if (abc.parse.state >= 2) {
						abc.syntax(1, abc.errs.ignored, line0);
						continue;
					}
					a = text.match(/(.*?)[= ]+(.*)/);
					if (!a || !a[2]) {
						abc.syntax(1, abc.errs.bad_val, 'm:');
						continue;
					}
					this.mac[a[1]] = a[2];
					this.maci[a[1][0]] = true; // first letter
					break;

				// info fields in tune body only
				case 's':
					if (abc.parse.state != 3 || abc.cfmt.writefields.indexOf(line0) < 0) break;
					(abc as any).get_sym(text, txt_add == ' ');
					break;
				case 'w':
					if (abc.parse.state != 3 || abc.cfmt.writefields.indexOf(line0) < 0) break;
					(abc as any).get_lyrics(text, txt_add == ' ');
					break;
				case '|': // "|:" starts a music line
					if (abc.parse.state < 2) continue;
					abc.parse.line.buffer = text;
					abc.parser.parse_music_line();
					continue;
				default:
					if ('ABCDFGHNOSZ'.indexOf(line0) >= 0) {
						if (abc.parse.state >= 2) {
							abc.syntax(1, errs.ignored, line0);
							continue;
						}
						//				if (abc.cfmt.writefields.indexOf(c) < 0)
						//					break
						if (!info[line0]) info[line0] = text;
						else info[line0] += txt_add + text;
						break;
					}

					// info field which may be embedded
					abc.parser.do_info(line0, text);
					continue;
			}
			txt_add = '\n';
			last_info = line0;
		}
		if (this.include) return;
		if (abc.parse.state == 1) {
			abc.syntax(1, 'End of file in tune header');
			abc.tune.get_key('C');
		}
		if (abc.parse.state >= 2) end_tune();
		if (sav.src && abc.cfmt.show_source[0] == '+') {
			user.img_out(sav.src); // source of all tunes
			sav.src = null;
		}
		abc.parse.state = 0;

	}
}
