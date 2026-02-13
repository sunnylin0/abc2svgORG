// abc2svg - Subs module
import { Abc, nil } from '../Abc';
import * as abc2svg from '../abc2svg';
import { C } from '../abc2svg';
import { Amusic, Aparser, Adeco, Adraw, Asvg, Asubs, Atune, Aformat, Afront, Alyrics, Agchord } from '../Store';
let abc: Abc;
export class Subs {
	add_fstyle: any;
	// Font tables (simplified for initial port, should copy full tables)
	sw_tb: Float32Array;
	ssw_tb: Float32Array;
	mw_tb: Float32Array;
	font_style: string = "";

	// estimate the width and height of a string ..
	strwh: any;
	constructor(abc_: Abc) {
		abc = abc_;
		this.add_fstyle = abc2svg.el
			? function (s) {
				var e;

				this.font_style += '\n' + s;
				if (!abc2svg.styles) {
					e = document.createElement('style');
					document.head.appendChild(e);
					abc2svg.styles = e;
				}
				sheet = abc2svg.styles.sheet;
				s = s.match(/[^{]+{[^}]+}/g); // insert each style
				while (1) {
					e = s.shift();
					if (!e) break;
					sheet.insertRule(e, sheet.cssRules.length);
				}
			} // this.add_fstyle()
			: function (s) {
				this.font_style += '\n' + s;
			};
		// Initialize tables (placeholders for full data)
		this.sw_tb = new Float32Array([
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 00
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 10
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
			0.25, 0.333, 0.408, 0.5, 0.5, 0.833, 0.778, 0.333, // 20
			0.333, 0.333, 0.5, 0.564, 0.25, 0.564, 0.25, 0.278,
			0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, // 30
			0.5, 0.5, 0.278, 0.278, 0.564, 0.564, 0.564, 0.444,
			0.921, 0.722, 0.667, 0.667, 0.722, 0.611, 0.556, 0.722, // 40
			0.722, 0.333, 0.389, 0.722, 0.611, 0.889, 0.722, 0.722,
			0.556, 0.722, 0.667, 0.556, 0.611, 0.722, 0.722, 0.944, // 50
			0.722, 0.722, 0.611, 0.333, 0.278, 0.333, 0.469, 0.5,
			0.333, 0.444, 0.5, 0.444, 0.5, 0.444, 0.333, 0.5, // 60
			0.5, 0.278, 0.278, 0.5, 0.278, 0.778, 0.5, 0.5,
			0.5, 0.5, 0.333, 0.389, 0.278, 0.5, 0.5, 0.722, // 70		
			0.5, 0.5, 0.444, 0.48, 0.2, 0.48, 0.541, 0.5,
		]);
		// sans-serif
		this.ssw_tb = new Float32Array([
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 00
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 10
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
			0.278, 0.278, 0.355, 0.556, 0.556, 0.889, 0.667, 0.191, // 20
			0.333, 0.333, 0.389, 0.584, 0.278, 0.333, 0.278, 0.278,
			0.556, 0.556, 0.556, 0.556, 0.556, 0.556, 0.556, 0.556, // 30
			0.556, 0.556, 0.278, 0.278, 0.584, 0.584, 0.584, 0.556,
			1.015, 0.667, 0.667, 0.722, 0.722, 0.667, 0.611, 0.778, // 40
			0.722, 0.278, 0.5, 0.667, 0.556, 0.833, 0.722, 0.778,
			0.667, 0.778, 0.722, 0.667, 0.611, 0.722, 0.667, 0.944, // 50
			0.667, 0.667, 0.611, 0.278, 0.278, 0.278, 0.469, 0.556,
			0.333, 0.556, 0.556, 0.5, 0.556, 0.556, 0.278, 0.556, // 60
			0.556, 0.222, 0.222, 0.5, 0.222, 0.833, 0.556, 0.556,
			0.556, 0.556, 0.333, 0.5, 0.278, 0.556, 0.5, 0.722, // 70
			0.5, 0.5, 0.5, 0.334, 0.26, 0.334, 0.584, 0.512,
		]);
		// monospace
		this.mw_tb = new Float32Array([
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 00
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 10
			0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, // 20
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52,
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, // 30
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52,
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, // 40
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52,
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, // 50
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52,
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, // 60
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52,
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, // 70
			0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52,
		]);
		//需要 browser 环境
		this.set_strwh();
	}

	set_strwh() {
		if (typeof document != 'undefined' && abc2svg.el) {
			// .. by the browser

			// change the function
			strwh = function (str) {
				if (str.wh) return str.wh;

				var c,
					el = abc2svg.el, // hidden <span> created by edit/abcweb/...
					font = abc.gene.curfont,
					h = font.size,
					w = 0,
					n = str.length,
					i0 = 0,
					i = 0;

				if (!el.parentElement)
					// insert back the <span> in the document
					document.body.appendChild(el);
				el.className = font_class(font);

				if (typeof str == 'object') {
					// if string already converted
					el.innerHTML = str;
					str.wh = [el.clientWidth, el.clientHeight];
					return str.wh;
				}
				str = abc.clean_txt(str);

				while (1) {
					i = str.indexOf('$', i);
					if (i >= 0) {
						c = str[i + 1];
						if (c == '0') {
							font = abc.gene.deffont;
						} else if (c >= '1' && c <= '9') {
							font = abc.get_font('u' + c);
						} else {
							i++;
							continue;
						}
						el.className = font_class(font);
					}

					el.innerHTML = str.slice(i0, i >= 0 ? i : undefined);
					w += el.clientWidth;
					//fixme: bad width if space(s) at end of string
					if (el.clientHeight > h) h = el.clientHeight;

					if (i < 0) break;
					i += 2;
					i0 = i;
				}
				return [w, h];
			};
		} else {

			// .. by internal tables
			this.strwh = function (str) {
				var font = abc.gene.curfont,
					swfac = font.swfac,
					h = font.size,
					w = 0,
					i,
					j,
					c,
					n = str.length;

				for (i = 0; i < n; i++) {
					c = str[i];
					switch (c) {
						case '$':
							c = str[i + 1];
							if (c == '0') {
								font = abc.gene.deffont;
							} else if (c >= '1' && c <= '9') {
								font = abc.get_font('u' + c);
							} else {
								c = '$';
								break;
							}
							i++;
							swfac = font.swfac;
							if (font.size > h) h = font.size;
							continue;
						case '&':
							if (str[i + 1] == ' ') break; // normal '&'
							j = str.indexOf(';', i);
							if (j > 0 && j - i < 10) {
								i = j;
								c = 'a'; // XML character reference
							}
							break;
					}
					w += abc.cwid(c, font) * swfac;
				}
				return [w, h];
			};
		}
	}


	// return the character width with the current font
	cwidf(c) {
		return cwid(c) * abc.gene.curfont.swfac;
	}

	// make XML clean
	clean_txt(p) {
		return p.replace(/<|>|&[^&\s]*?;|&/g, function (c) {
			switch (c) {
				case '<':
					return '&lt;';
				case '>':
					return '&gt;';
				case '&':
					return '&amp;';
			}
			return c; // &xxx;
		});
	} // abc.clean_txt()




	// convert a string to a SVG text, handling the font changes
	// The string size is memorized into the String.
	str2svg(str) {
		// check if the string is already converted
		if (typeof str == 'object') return str;

		var n_font,
			wh,
			o_font = abc.gene.deffont,
			c_font = abc.gene.curfont,
			o = '';

		// start a '<abc.tspan>' element
		tspan(nf, of) {
			var cl;

			if (
				nf.class &&
				nf.name == of.name &&
				nf.size == of.size &&
				nf.weight == of.weight &&
				nf.style == of.style
			)
				cl = nf.class; // change only the class
			else cl = font_class(nf);

			return '<abc.tspan\n\tclass="' + cl + '">';
		} // abc.tspan()

		if (c_font != o_font) o = abc.tspan(c_font, o_font);
		o += str.replace(/<|>|&[^&\s]*?;|&|\$./g, function (c) {
			switch (c) {
				case '<':
					return '&lt;';
				case '>':
					return '&gt;';
				case '&':
					return '&amp;';
				default:
					if (c[0] != '$') break;
					if (c[1] == '0') n_font = abc.gene.deffont;
					else if (c[1] >= '1' && c[1] <= '9') n_font = abc.get_font('u' + c[1]);
					else break;
					c = '';
					if (n_font == c_font) return c;
					if (c_font != o_font) c = '</abc.tspan>';
					c_font = n_font;
					if (c_font == o_font) return c;
					return c + abc.tspan(c_font, o_font);
			}
			return c; // &xxx;
		});
		if (c_font != o_font) o += '</abc.tspan>';

		// convert to String and memorize the string width and height
		o = new String(o);
		if (abc2svg.el)
			strwh(o); // browser
		else o.wh = abc.strwh(str); // CLI

		abc.gene.curfont = c_font; // keep the current font for the next paragraph

		return o;
	} // abc.str2svg()

	// set the default and current font
	set_font(xxx) {
		if (typeof xxx == 'string') xxx = abc.get_font(xxx);
		abc.gene.curfont = abc.gene.deffont = xxx;
	}

	// output a string handling the font changes
	out_str(str) {
		abc.output += abc.str2svg(str);
	}

	// output a string, handling the font changes
	// the action is:
	//	'c' align center
	//	'r' align right
	//	'j' justify - w is the line width
	//	otherwise align left
	xy_str(
		x,
		y,
		str, // string or object String with attribute 'wh'
		action, // default: align left
		w, // needed for justify
		wh,
	) {
		// optional [width, height]
		if (!wh) wh = str.wh || abc.strwh(str);
		if (abc.cfmt.singleline || abc.cfmt.trimsvg) {
			var wx = wh[0];
			switch (action) {
				case 'c':
					wx = wh[0] / 2;
					break;
				case 'j':
					wx = w;
					break;
				case 'r':
					wx = 0;
					break;
			}
			if (abc.img.wx < x + wx) abc.img.wx = x + wx;
		}

		abc.output += '<text class="' + font_class(abc.gene.deffont);
		if (action != 'j' && str.length > 5 && abc.gene.deffont.wadj)
			abc.output +=
				'" lengthAdjust="' +
				abc.gene.deffont.wadj +
				'" textLength="' +
				wh[0].toFixed(1);
		abc.output += '" x="';
		out_sxsy(x, '" y="', y);
		switch (action) {
			case 'c':
				abc.output += '" text-anchor="middle">';
				break;
			case 'j':
				abc.output += '" textLength="' + w.toFixed(1) + '">';
				break;
			case 'r':
				abc.output += '" text-anchor="end">';
				break;
			default:
				abc.output += '">';
				break;
		}
		out_str(str);
		abc.output += '</text>\n';
	}

	// move last capitalized word to front when after a comma
	trim_title(title, is_subtitle) {
		var i;

		if (abc.cfmt.titletrim) {
			i = title.lastIndexOf(', ');
			if (i < 0 || title[i + 2] < 'A' || title[i + 2] > 'Z') {
				i = 0;
			} else if (abc.cfmt.titletrim == 1) {
				// (true) compatibility
				if (i < title.length - 7 || title.indexOf(' ', i + 3) >= 0) i = 0;
			} else {
				if (i < title.length - abc.cfmt.titletrim - 2) i = 0;
			}
			if (i) title = title.slice(i + 2).trim() + ' ' + title.slice(0, i);
		}
		if (!is_subtitle && abc.cfmt.writefields.indexOf('X') >= 0)
			title = abc.info.X + '.  ' + title;
		if (abc.cfmt.titlecaps) return title.toUpperCase();
		return title;
	}

	// return the width of the music line
	get_lwidth() {
		if (abc.img.chg) set_page();
		return (
			(abc.img.width - abc.img.lm - abc.img.rm - 2) / // for bar thickness at eol
			abc.cfmt.scale
		);
	}

	// header generation functions
	write_title(title, is_subtitle) {
		var h, wh;

		if (!title) return;
		set_page();
		if (is_subtitle) {
			set_font('subtitle');
			h = abc.cfmt.subtitlespace;
		} else {
			set_font('title');
			h = abc.cfmt.titlespace;
		}
		wh = abc.strwh(title);
		wh[1] += abc.gene.curfont.pad * 2;
		vskip(wh[1] + h + abc.gene.curfont.pad);
		h = abc.gene.curfont.pad + wh[1] * 0.22; // + descent
		if (abc.cfmt.titleleft) abc.xy_str(0, h, title, null, null, wh);
		else abc.xy_str(abc.get_lwidth() / 2, h, title, 'c', null, wh);
	}

	/* -- output a header format '111 (222)' -- */
	put_inf2r(x, y, str1, str2, action) {
		if (!str1) {
			if (!str2) return;
			str1 = str2;
			str2 = null;
		}
		if (!str2) abc.xy_str(x, y, str1, action);
		else abc.xy_str(x, y, str1 + ' (' + str2 + ')', action);
	}

	/* -- write a text block (%%begintext / %%text / %%center) -- */
	write_text(text, action) {
		if (action == 's') return; // skip
		set_page();

		var wh,
			font,
			o,
			strlw = abc.get_lwidth(),
			sz = abc.gene.curfont.size,
			lineskip = sz * abc.cfmt.lineskipfac,
			parskip = sz * abc.cfmt.parskipfac,
			i,
			j,
			x,
			words,
			w,
			k,
			ww,
			str;

		switch (action) {
			default:
				//	case 'c':
				//	case 'r':
				font = abc.gene.curfont;
				switch (action) {
					case 'c':
						x = strlw / 2;
						break;
					case 'r':
						x = strlw - font.pad;
						break;
					default:
						x = font.pad;
						break;
				}
				j = 0;
				while (1) {
					i = text.indexOf('\n', j);
					if (i == j) {
						// new paragraph
						vskip(parskip);
						blk_flush();
						use_font(abc.gene.curfont);
						while (text[i + 1] == '\n') {
							vskip(lineskip);
							i++;
						}
						if (i == text.length) break;
					} else {
						if (i < 0) str = text.slice(j);
						else str = text.slice(j, i);
						ww = abc.strwh(str);
						vskip(ww[1] * abc.cfmt.lineskipfac + font.pad * 2);
						xy_str(x, font.pad + ww[1] * 0.2, str, action);
						if (i < 0) break;
					}
					j = i + 1;
				}
				vskip(parskip);
				blk_flush();
				break;
			case 'f':
			case 'j':
				j = 0;
				while (1) {
					i = text.indexOf('\n\n', j);
					if (i < 0) words = text.slice(j);
					else words = text.slice(j, i);
					words = words.split(/\s+/);
					w = k = wh = 0;
					for (j = 0; j < words.length; j++) {
						ww = abc.strwh(words[j] + ' '); // &nbsp;
						w += ww[0];
						if (w >= strlw) {
							vskip(wh * abc.cfmt.lineskipfac);
							xy_str(0, ww[1] * 0.2, words.slice(k, j).join(' '), action, strlw, [
								w - ww[0],
								ww[1],
							]);
							k = j;
							w = ww[0];
							wh = 0;
						}
						if (ww[1] > wh) wh = ww[1];
					}
					if (w != 0) {
						// last line
						vskip(wh * abc.cfmt.lineskipfac);
						xy_str(0, ww[1] * 0.2, words.slice(k).join(' '));
					}
					vskip(parskip);
					blk_flush();
					if (i < 0) break;
					while (text[i + 2] == '\n') {
						vskip(lineskip);
						i++;
					}
					if (i == text.length) break;
					use_font(abc.gene.curfont);
					j = i + 2;
				}
				break;
		}
	}

	/* -- output the words after tune -- */
	put_words(words) {
		var p,
			i,
			j,
			nw,
			w,
			lw,
			x1,
			x2,
			i1,
			i2,
			do_flush,
			maxn = 0, // max number of characters per line
			n = 1; // number of verses

		// output a line of words after tune
		put_wline(p, x) {
			var i = 0,
				k = 0;

			if (
				p[0] == '$' && // if font change
				p[1] >= '0' &&
				p[1] <= '9'
			) {
				abc.gene.curfont = p[1] == '0' ? abc.gene.deffont : get_font('u' + p[1]);
				p = p.slice(2);
			}

			if ((p[i] >= '0' && p[i] <= '9') || p[i + 1] == '.') {
				while (i < p.length) {
					i++;
					if (p[i] == ' ' || p[i - 1] == ':' || p[i - 1] == '.') break;
				}
				k = i;
				while (p[i] == ' ') i++;
			}

			var y = abc.gene.curfont.size * 0.22; // descent
			if (k != 0) abc.xy_str(x, y, p.slice(0, k), 'r');
			if (i < p.length) abc.xy_str(x + 5, y, p.slice(i), 'l');
		} // put_wline()

		// estimate the width of the lines
		words = words.split('\n');
		nw = words.length;
		for (i = 0; i < nw; i++) {
			p = words[i];
			if (!p) {
				while (i + 1 < nw && !words[i + 1]) i++;
				n++;
			} else if (p.length > maxn) {
				maxn = p.length;
				i1 = i; // keep this line
			}
		}
		if (i1 == undefined) return; // no text in the W: lines!

		set_font('words');
		vskip(abc.cfmt.wordsspace);
		svg_flush();

		w = abc.get_lwidth() / 2; // half line width
		lw = abc.strwh(words[i1])[0];
		i1 = i2 = 0;
		if (lw < w) {
			// if 2 columns
			j = n >> 1;
			for (i = 0; i < nw; i++) {
				p = words[i];
				if (!p) {
					if (--j <= 0) i1 = i;
					while (i + 1 < nw && !words[i + 1]) i++;
					if (j <= 0) {
						i2 = i + 1;
						break;
					}
				}
			}
			n >>= 1;
		}
		if (i2) {
			x1 = (w - lw) / 2 + 10;
			x2 = x1 + w;
		} else {
			// one column
			x2 = w - lw / 2 + 10;
		}

		do_flush = true;
		for (i = 0; i < i1 || i2 < nw; i++, i2++) {
			vskip(abc.cfmt.lineskipfac * abc.gene.curfont.size);
			if (i < i1) {
				p = words[i];
				if (p) put_wline(p, x1);
				else use_font(abc.gene.curfont);
			}
			if (i2 < nw) {
				p = words[i2];
				if (p) {
					put_wline(p, x2);
				} else {


					if (--n == 0) {
						if (i < i1) {
							n++;
						} else if (i2 < nw - 1) {

							// center the last verse
							x2 = w - lw / 2 + 10;
							svg_flush();
						}
					}
				}
			}

			if (!words[i + 1] && !words[i2 + 1]) {
				if (do_flush) {
					svg_flush();
					do_flush = false;
				}
			} else {
				do_flush = true;
			}
		}
	}

	/* -- output history -- */
	put_history() {
		var i,
			j,
			c,
			str,
			font,
			h,
			w,
			wh,
			head,
			names = abc.cfmt.infoname.split('\n'),
			n = names.length;

		for (i = 0; i < n; i++) {
			c = names[i][0];
			if (abc.cfmt.writefields.indexOf(c) < 0) continue;
			str = abc.info[c];
			if (!str) continue;
			if (!font) {
				font = true;
				set_font('history');
				vskip(abc.cfmt.textspace);
				h = abc.gene.curfont.size * abc.cfmt.lineskipfac;
			}
			head = names[i].slice(2);
			if (head[0] == '"') head = head.slice(1, -1);
			vskip(h);
			wh = abc.strwh(head);
			xy_str(0, wh[1] * 0.22, head, null, null, wh);
			w = wh[0];
			str = str.split('\n');
			xy_str(w, wh[1] * 0.22, str[0]);
			for (j = 1; j < str.length; j++) {
				if (!str[j]) {
					// new paragraph
					vskip(abc.gene.curfont.size * abc.cfmt.parskipfac);
					continue;
				}
				vskip(h);
				xy_str(w, wh[1] * 0.22, str[j]);
			}
			vskip(h * abc.cfmt.parskipfac);
			use_font(abc.gene.curfont);
		}
	}

	// build a new sequence of the parts with clearer names
	part_seq() {
		var i,
			o = '';

		for (i = 0; i < abc.info.P.length; i++) {
			if (i) o += ' ';
			o += abc.partname(abc.info.P[i])[1];
		}
		return o;
	} // abc.part_seq()

	// get the meaningful names of a part (P:)
	partname(c) {
		var i, r, tmp;

		if (abc.cfmt.abc.partname) {
			tmp = abc.cfmt.abc.partname.split('\n');

			for (i = 0; i < tmp.length; i++) {
				if (tmp[i][0] == c) {
					r = tmp[i].match(/.\s+(\S+)\s*(.+)?/);
					break;
				}
			}
		}
		if (!r) return [0, c, c];
		if (!r[2]) r[2] = r[1];
		if (r[2][0] == '"') r[2] = r[2].slice(1, -1);
		return r;
	} // abc.partname()

	/* -- output the tune heading -- */
	// (possible hook)
	tunhd() {
		var i,
			j,
			area,
			composer,
			origin,
			rhythm,
			down1,
			down2,
			p,
			lwidth = abc.get_lwidth();

		vskip(abc.cfmt.topspace);

		/* titles */
		if (abc.info.T && abc.cfmt.writefields.indexOf('T') >= 0) {
			i = 0;
			while (1) {
				j = abc.info.T.indexOf('\n', i);
				if (j < 0) {
					write_title(abc.info.T.substring(i), i != 0);
					break;
				}
				write_title(abc.info.T.slice(i, j), i != 0);
				i = j + 1;
			}
		}

		/* rhythm, composer, origin */
		down1 = down2 = 0;
		if (
			abc.parse.ckey.k_bagpipe &&
			!abc.cfmt.infoline &&
			abc.cfmt.writefields.indexOf('R') >= 0
		)
			rhythm = abc.info.R;
		if (rhythm) {
			set_font('composer');
			down1 = abc.cfmt.composerspace + abc.gene.curfont.size + 2;
			xy_str(0, -down1 + abc.gene.curfont.size * 0.22, rhythm);
		}
		area = abc.info.A;
		if (abc.cfmt.writefields.indexOf('C') >= 0) composer = abc.info.C;
		if (abc.cfmt.writefields.indexOf('O') >= 0) origin = abc.info.O;
		if (composer || origin || abc.cfmt.infoline) {
			var xcomp, align;

			set_font('composer');
			if (abc.cfmt.aligncomposer < 0) {
				xcomp = 0;
				align = ' ';
			} else if (abc.cfmt.aligncomposer == 0) {
				xcomp = lwidth * 0.5;
				align = 'c';
			} else {
				xcomp = lwidth;
				align = 'r';
			}
			if (composer || origin) {
				down2 = abc.cfmt.composerspace + 2;
				i = 0;
				while (1) {
					down2 += abc.gene.curfont.size;
					if (composer) j = composer.indexOf('\n', i);
					else j = -1;
					if (j < 0) {
						put_inf2r(
							xcomp,
							-down2 + abc.gene.curfont.size * 0.22,
							composer ? composer.substring(i) : null,
							origin,
							align,
						);
						break;
					}
					xy_str(
						xcomp,
						-down2 + abc.gene.curfont.size * 0.22,
						composer.slice(i, j),
						align,
					);
					i = j + 1;
				}
			}

			rhythm = rhythm ? null : abc.info.R;
			if ((rhythm || area) && abc.cfmt.infoline) {

				/* if only one of rhythm or area then do not use ()'s
				 * otherwise output 'rhythm (area)' */
				set_font('info');
				down2 += abc.cfmt.infospace + abc.gene.curfont.size;
				put_inf2r(lwidth, -down2 + abc.gene.curfont.size * 0.22, rhythm, area, 'r');
			}
		}

		/* parts */
		if (abc.info.P && abc.cfmt.writefields.indexOf('P') >= 0) {
			set_font('parts');
			i = abc.cfmt.partsspace + abc.gene.curfont.size + abc.gene.curfont.pad;
			if (down1 + i > down2) down2 = down1 + i;
			else down2 += i;
			p = abc.info.P;
			if (abc.cfmt.abc.partname) p = abc.part_seq();
			xy_str(0, -down2 + abc.gene.curfont.size * 0.22, p);
			down2 += abc.gene.curfont.pad;
		} else if (down1 > down2) {
			down2 = down1;
		}
		vskip(down2 + abc.cfmt.musicspace);
	}; // tunhd()

	// output the tune header
	write_heading() {
		vskip(abc.cfmt.topspace);
		self.tunhd();
	} // abc.write_heading()

}




