
// Type definitions for abc2svg-1.js
// Project: abc2svg

declare namespace abc2svg {
	// Constants
	const C: {
		BLEN: number;
		BAR: number;
		CLEF: number;
		CUSTOS: number;
		SM: number;
		GRACE: number;
		KEY: number;
		METER: number;
		MREST: number;
		NOTE: number;
		PART: number;
		REST: number;
		SPACE: number;
		STAVES: number;
		STBRK: number;
		TEMPO: number;
		BLOCK: number;
		REMARK: number;
		FULL: number;
		EMPTY: number;
		OVAL: number;
		OVALBARS: number;
		SQUARE: number;
		SL_ABOVE: number;
		SL_BELOW: number;
		SL_AUTO: number;
		SL_HIDDEN: number;
	};

	// Arrays and Lookup Tables
	const sym_name: string[];
	const keys: Int8Array[];
	const p_b40: Int8Array;
	const b40_p: Int8Array;
	const b40_a: Int8Array;
	const b40_m: Int8Array;
	const b40l5: Int8Array;
	const isb40: Int8Array;
	const ch_alias: { [key: string]: string };
	const font_tb: any[];
	const font_st: any;
	const hdn: any;
	const ft_w: { [key: string]: number };
	const ft_re: RegExp;
	const lypre: RegExp;

	// Static Functions
	function pab40(p: number, a: number): number;
	function b40p(b: number): number;
	function b40a(b: number): number;
	function b40m(b: number): number;
	function rat(n: number, d: number): [number, number];
	function pitcmp(n1: any, n2: any): number;

	// Main Class
	class Abc {
		constructor(user: any);

		// Properties on prototype (methods)
		static clone(obj: any, lvl?: number): any;
		static errbld(sev: number, txt: string, fn: string, idx: number): void;
		static error(sev: number, s: any, msg: string, a1?: any, a2?: any, a3?: any, a4?: any): void;
		static syntax(sev: number, msg: string, a1?: any, a2?: any, a3?: any, a4?: any): void;
		static js_inject(js: string): void;

		// Instance methods (from prototype)
		// Helper functions attached to Abc (some seem to be static helper functions on prototype or class)
		// In the file they are Abc.something = ... which is Static.
		// But Abc.prototype.something = ... is Instance.

		// Static methods from outline (defined as Abc.methodname = function...)
		static y_get(st: number, up: boolean, x: number, w: number): number;
		static y_set(st: number, up: boolean, x: number, w: number, y: number): void;
		static up3(s: AbcSymbol, pos: number): boolean | number;
		static up6(s: AbcSymbol, pos: number): boolean;
		static d_arp(de: AbcDeco): void;
		static d_near(de: AbcDeco): void;
		static d_slide(de: AbcDeco): void;
		static d_trill(de: AbcDeco): void;
		static d_upstaff(de: AbcDeco): void;
		static deco_add(param: string): void;
		static deco_def(nm: string, nmd?: string): AbcDecoDef;
		static do_ctie(nm: string, s: AbcSymbol, nt1: AbcNote): void;
		static get_dd(nm: string): AbcDecoDef;
		static deco_cnv(s: AbcSymbol, prev: AbcSymbol): void;
		static dh_cnv(s: AbcSymbol, nt: AbcNote): void;
		static deco_update(s: AbcSymbol, dx: number): void;
		static deco_width(s: AbcSymbol, wlnt: number): number;
		static deco_wch(nt: AbcNote): number;

		// Instance methods (Abc.prototype.*)
		draw_all_deco(): void;
		draw_deco_near(): void;
		draw_deco_note(): void;
		draw_deco_staff(): void;
		draw_measnb(): void;
		draw_partempo(): void;
		b_pos(grace: AbcSymbol, stem: number, nflags: number, b: number): void;
		sym_dup(s: AbcSymbol): void;
		calculate_beam(bm: any, s1: AbcSymbol): void;
		draw_beams(bm: any): void;
		draw_lstaff(x: number): void;
		draw_meter(s: AbcSymbol): void;
		draw_acc(x: number, y: number, a: number): void;
		set_hl(p_st: number, n: number, x: number, dx1: number, dx2: number): void;
		draw_hl(s: AbcSymbol): void;
		draw_keysig(x: number, s: AbcSymbol): void;
		nrep_out(x: number, y: number, n: number): void;
		center_rest(s: AbcSymbol): void;
		draw_rest(s: AbcSymbol): void;
		draw_mrest(s: AbcSymbol): void;
		grace_slur(s: AbcSymbol): void;
		draw_gracenotes(s: AbcSymbol): void;
		setdoty(s: AbcSymbol, y_tb: number[]): void;
		y_head(s: AbcSymbol, note: AbcNote): void;
		draw_basic_note(s: AbcSymbol, m: number, y_tb: number[]): void;
		draw_note(s: AbcSymbol, fl: boolean): void;
		prev_scut(s: AbcSymbol): AbcSymbol;
		slur_direction(k1: AbcSymbol, k2: AbcSymbol): number;
		slur_out(x1: number, y1: number, x2: number, y2: number, dir: number, height: number, dotted: boolean): void;
		draw_slur(path: any[], sl: AbcSlur, recurr: boolean): void;
		draw_slurs(s: AbcSymbol, last: AbcSymbol): void;
		draw_tuplet(s1: AbcSymbol): void;
		draw_tie(not1: AbcNote, not2: AbcNote, job: number): void;
		draw_all_ties(p_voice: AbcVoice): void;
		draw_sym_near(): void;
		draw_vname(indent: number, stl: number): void;
		set_staff(): void;
		draw_systems(indent: number): void;
		draw_symbols(p_voice: AbcVoice): void;
		draw_all_sym(): void;
		set_tie_dir(s: AbcSymbol): void;

		// ... add other prototype methods
		set_repeat(s: AbcSymbol): void;
		custos_add(s: AbcSymbol): void;
		set_nl(s: AbcSymbol): void;
		get_ck_width(): number;
		get_width(s: AbcSymbol, next: AbcSymbol): void;
		set_lines(s: AbcSymbol, next: AbcSymbol, lwidth: number, indent: number): void;
		cut_tune(lwidth: number, lsh: number): void;
		set_yval(s: AbcSymbol): void;
		set_ottava(): void;
		mrest_expand(): void;
		set_auto_clef(st: number, s_start: AbcSymbol, clef_type_start: string): void;
		set_clefs(): void;
		roffs(s: AbcSymbol): void;
		set_pitch(last_s: AbcSymbol): void;
		set_stem_dir(): void;
		set_rest_offset(): void;
		new_sym(s: AbcSymbol, p_v: AbcVoice, last_s: AbcSymbol): void;
		init_music_line(): void;
		check_end_bar(): void;

		set_words(p_voice: AbcVoice): void;
		set_rb(p_voice: AbcVoice): void;
		set_global(): void;
		get_lshift(): void;
		set_indent(lsh: number): void;
		set_beams(sym: AbcSymbol): void;
		same_head(s1: AbcSymbol, s2: AbcSymbol): void;
		unison_acc(s1: AbcSymbol, s2: AbcSymbol, i1: number, i2: number): void;
		set_left(s: AbcSymbol): void;
		set_right(s: AbcSymbol): void;
		set_overlap(): void;
		set_stems(): void;
		block_gen(s: AbcSymbol): void;
		set_piece(): void;
		set_sym_glue(width: number): void;
		set_sym_line(): void;
		set_posx(): void;
		gen_init(): void;
		output_music(): void;
		out_stem(x: number, y: number, h: number, grace: boolean, nflags: number, straight: boolean): void;
		out_trem(x: number, y: number, ntrem: number): void;
		out_tubr(x: number, y: number, dx: number, dy: number, up: boolean): void;
		out_tubrn(x: number, y: number, dx: number, dy: number, up: boolean, str: string): void;
		out_wln(x: number, y: number, w: number): void;
		out_deco_str(x: number, y: number, de: AbcDeco): void;
		out_arp(x: number, y: number, val: number): void;
		out_cresc(x: number, y: number, val: number, defl: AbcDecoFlags): void;
		out_dim(x: number, y: number, val: number, defl: AbcDecoFlags): void;
		out_ltr(x: number, y: number, val: number): void;
		out_lped(x: number, y: number, val: number, defl: AbcDecoFlags): void;
		out_8va(x: number, y: number, val: number, defl: AbcDecoFlags): void;
		out_8vb(x: number, y: number, val: number, defl: AbcDecoFlags): void;
		out_15ma(x: number, y: number, val: number, defl: AbcDecoFlags): void;
		out_15mb(x: number, y: number, val: number, defl: AbcDecoFlags): void;
		lped(x: number, y: number, val: number, defl: AbcDecoFlags): void;
		out_deco_val(x: number, y: number, name: string, val: number, defl: AbcDecoFlags): void;
		out_glisq(x2: number, y2: number, de: AbcDeco): void;
		out_gliss(x2: number, y2: number, de: AbcDeco): void;
		out_deco_long(x: number, y: number, de: AbcDeco): void;
		tempo_note(str: string, s: AbcSymbol, dur: number, dy: number): void;
		tempo_build(s: AbcSymbol): void;
		writempo(s: AbcSymbol, x: number, y: number): void;
		vskip(h: number): void;
		clr_sty(): void;
		svg_flush(): void;
		blk_flush(): void;
		voice_filter(): void;
		sym_link(s: AbcSymbol): void;
		sym_add(p_voice: AbcVoice, type: number): void;
		sort_all(): void;
		voice_adj(sys_chg: boolean): void;
		new_syst(init: boolean): void;
		set_bar_num(): void;
		not2abc(pit: number, acc: number): void;
		get_map(text: string): void;
		get_transp(param: string): void;
		do_pscom(text: string): void;
		do_begin_end(type: string, opt: any, text: string): void;
		generate(): void;
		key_trans(): void;
		fill_mr_ba(p_v: AbcVoice): void;
		get_staves(cmd: string, parm: string): void;
		clone_voice(id: string): void;
		get_vover(type: string): void;
		is_voice_sig(): void;
		get_clef(s: AbcSymbol): void;
		get_key(parm: string): void;
		new_voice(id: string): void;
		init_tune(): void;
		// Exposed properties
		// Exposed properties
		// Exposed properties
		tunes: AbcTune[];
		glovar(): AbcGlovar;
		stv_g(): AbcStvG;
		get_img(): AbcImg;
		get_glyphs(): { [key: string]: string };
		get_multi(): AbcMulticol;
	}
}
/** SVG 生成狀態 */
interface AbcStvG {
	scale: number;
	stsc: number;
	vsc: number;
	dy: number;
	st: number;
	v: number;
	g: number;
	color?: string;
}
/** (影像/頁面尺寸) */
interface AbcImg {
	width: number;
	lm: number;
	rm: number;
	wx: number;
	chg: number;
}
/** 多欄排版狀態 */
interface AbcMulticol {
	state: number;
	posy: number;
	maxy: number;
	lm: number;
	rm: number;
	w: number;
	sc: number;
}
/** 用於計算連音 */
interface AbcTuple {
	p: number;
	q: number;
	r: number;
	ro: number;
	f: any; // curvoice.tup || cfmt.tuplets
}

interface AbcSlur {
	ty: number;
	ss?: AbcSymbol;
	se: AbcSymbol;
	loc?: string; // 'i' | 'o'
	id?: string;
	d?: number;
}

interface AbcDecoFlags {
	nost?: boolean;
	noen?: boolean;
	[key: string]: any;
}

interface AbcScanBuf {
	index: number;
	buffer: string;
	char(): string;
	next_char(): string;
	get_int(): number;
}

interface AbcMeter {
	type: number;
	wmeasure: number;
	a_meter: { top: number, bot: number }[];
}

interface AbcGlovar {
	meter: AbcMeter;	//拍號物件的結構
	ottava?: number;		//(八度音)
	mrest_p?: boolean | number;//(多小節休止符旗標)
	music_h?: number;//(音樂高度)
	ulen?: number;//(單位長度)
	tempo?: AbcSymbol;//(速度標記)
	new_nbar?: number;//(新小節號)
	[key: string]: any;
}

interface AbcParse {
	ctx: any;
	prefix: string;
	state: number;
	ottava: number[];
	line: AbcScanBuf;
	ckey?: AbcSymbol;
	bol?: number;
	file?: string;
	fname?: string;
	istart?: number;
	iend?: number;
	voice_opts?: { [key: string]: any };
	tune_v_opts?: { [key: string]: any };
	scores?: string[];
	ufmt?: boolean;
	pos?: number;
	next?: AbcParse;
	[key: string]: any;
}
/**
 * 樂曲資訊物件結構
 */
interface AbcInfo {
	P?: string; // Parts
	W?: string; // Words (lyrics)
	[key: string]: any; // Allow other header fields
}
/**
 * 格式物件結構
 */
interface AbcFormat {
	pagewidth?: number;
	pageheight?: number;
	scale?: number;
	measurebox?: boolean;
	gchordbox?: boolean;
	botmargin?: number;
	topmargin?: number;
	rightmargin?: number;
	leftmargin?: number;
	fullsvg?: string;
	header?: number;
	footer?: number;
	transp?: number;
	quiet?: number;
	decoerr?: boolean;
	[key: string]: any;
}
/**
 * 樂曲物件結構
 * [tsfirst, voice_tb, info, cfmt]
 * tsfirst: AbcSymbol 樂曲的符號鏈結串列開頭
 * voice_tb: AbcVoice[] 聲部陣列
 * info: AbcInfo 樂曲資訊
 * cfmt: AbcFormat 格式化參數
 */
type AbcTune = [AbcSymbol | null, AbcVoice[], AbcInfo, AbcFormat];


interface AbcNote {
	pit: number;
	acc?: number;
	shhd?: number; // shift head
	shac?: number; // shift accidental
	dur: number;
	invis?: boolean;
	a_dd?: AbcDecoDef[]; // decorations
	color?: string;
	tie_s?: AbcNote; // Start of tie
	tie_e?: AbcNote; // End of tie
	tie_ty?: number; // Tie type
}

interface AbcSymbol {
	type: number; // C.NOTE, C.BAR, etc.
	st: number; // staff index
	v: number; // voice index
	x: number;
	y: number;
	ys: number; // stem y
	dur: number; // duration
	dur_orig?: number; // original duration
	time: number; // start time
	next: AbcSymbol | null;
	prev: AbcSymbol | null;
	ts_prev: AbcSymbol | null; // time series previous
	ts_next: AbcSymbol | null; // time series next
	extra?: AbcSymbol; // grace notes
	ottava?: number;

	// Note specific
	notes?: AbcNote[];
	nhd?: number; // index of last note head (notes.length - 1)
	stem?: number; // direction/length
	nflags?: number;
	beam_st?: boolean;
	beam_end?: boolean;
	beam_on?: boolean;
	invis?: boolean;
	grace?: boolean;
	dots?: number;
	stemless?: boolean;
	xstem?: boolean;
	trem1?: boolean;
	trem2?: boolean;
	ntrem?: number;
	head?: number; // C.FULL, C.EMPTY etc
	a_dd?: AbcDecoDef[]; // decorations
	color?: string;

	// Bar specific
	bar_type?: string | string[];
	rbstart?: number; // repeat bracket start
	rbstop?: number; // repeat bracket stop
	norepbra?: boolean; // no repeat bracket

	// Clef specific
	clef_type?: string;
	clef_name?: string;
	clef_octave?: number;
	clef_small?: boolean;

	// Container refs
	p_v?: AbcVoice;
	fmt?: AbcFormat; // formatting options
	sls?: AbcSlur[];

	// Parsing/Linking
	fname?: string;
	istart?: number;
	iend?: number;
	second?: boolean;
	floating?: boolean;
	soln?: boolean; // start of line

	// Errors
	err?: boolean;
}

interface AbcVoice {
	id: string;
	v: number; // voice index
	sym: AbcSymbol | null; // Start of symbol list
	last_sym: AbcSymbol | null; // End of symbol list
	last_bar?: AbcSymbol | null;

	// Current State
	ckey: AbcSymbol; // Current key signature symbol
	meter: AbcSymbol; // Current meter symbol
	clef: AbcSymbol; // Current clef symbol
	scale: number;
	time: number; // Current time in voice

	// Context
	wmeasure?: number;
	staffnonote?: number;
	acc?: number[]; // Accidentals
	sls?: AbcSlur[]; // Slurs
	ottava?: number;
	hy_st?: number; // Hyphen state
	pos?: {
		stm?: number; // Stem direction
		[key: string]: any;
	};

	// Flags
	ignore?: boolean;
	second?: boolean;
	floating?: boolean;
	eoln?: boolean;
	cst?: number; // Current staff
	new?: boolean;
}


interface AbcDecoDef {
	name: string;
	func: number;
	glyph?: string; //字型路徑定義
	h: number; // height
	hd?: number;
	wl: number; // width left
	wr: number; // width right
	str?: string;
	dx?: number;
	dy?: number;
	ty?: string;
	dd_st?: AbcDecoDef; // Start decoration definition
	dd_en?: AbcDecoDef; // End decoration definition
}

interface AbcDeco {
	s: AbcSymbol;
	dd: AbcDecoDef;
	st: number; // staff index
	ix: number; // index in a_de
	defl: AbcDecoFlags;
	x: number;
	y: number;
	pos?: number;
	up?: boolean | number;
	inv?: boolean | number;
	m?: number; // note index in symbol
	ldst?: boolean; // long decoration start
	lden?: boolean; // long decoration end
	val?: number; // width/value
	has_val?: boolean;
	start?: AbcDeco;
	prev?: AbcDeco;
	cont?: boolean;
}