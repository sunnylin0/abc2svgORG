$fileSvg = 'c:\GitHub\abc2svgORG\src\modules\Svg.ts'
$fileDeco = 'c:\GitHub\abc2svgORG\src\modules\Deco.ts'
$fileTune = 'c:\GitHub\abc2svgORG\src\modules\Tune.ts'
$fileSubs = 'c:\GitHub\abc2svgORG\src\modules\Subs.ts'
$fileLyrics = 'c:\GitHub\abc2svgORG\src\modules\Lyrics.ts'

function Apply-Replace($file, $replacements) {
    if (Test-Path $file) {
        Write-Host "Processing $file"
        $c = Get-Content $file -Raw -Encoding UTF8
        foreach ($r in $replacements) {
            $c = [Regex]::Replace($c, $r[0], $r[1])
        }
        Set-Content $file $c -Encoding UTF8
    }
}

# Svg.ts Replacements
$replacementsSvg = @(
    @("(?<!this\.|this\.abc\.|[\w\.])(gla|glout|stv_g|posy|posx|img|blkdiv|tgls|defs|style|fulldefs|font_style|defined_glyph|glyphs|output|set_sscale|set_scale|set_dscale|set_g|set_color|out_XYAB|out_sxsy|sx|sy|ax|ay|sh|ah|xypath|draw_all_hl|xygl|def_use|defs_add|out_acciac|out_brace|out_bracket|out_hyph|out_stem|out_trem|out_tubr|out_tubrn|out_wln|out_deco_str|out_arp|out_cresc|out_dim|out_ltr|out_lped|out_8va|out_8vb|out_15ma|out_15mb|out_deco_val|out_glisq|out_gliss|out_deco_long|tempo_note|tempo_build|writempo|vskip|clr_sty|svg_flush|blk_flush)(?=\b)", 'this.$1'),
    
    @("(?<!this\.)\bstaff_tb\b", "this.abc.staff_tb"),
    @("(?<!this\.)\bvoice_tb\b", "this.abc.voice_tb"),
    @("(?<!this\.)\btsfirst\b", "this.abc.tsfirst"),
    @("(?<!this\.)\btsnext\b", "this.abc.tsnext"),
    @("(?<!this\.)\bcfmt\b", "this.abc.cfmt"),
    @("(?<!this\.)\buser\b", "this.abc.user"),
    @("(?<!this\.)\bgene\b", "this.abc.gene"),
    @("(?<!this\.)\btunes\b", "this.abc.tunes"),
    @("(?<!this\.)\bpsvg\b", "this.abc.psvg"),
    @("(?<!this\.)\bget_font\b", "this.abc.get_font"),
    @("(?<!this\.)\bset_font\b", "this.abc.set_font"),
    @("(?<!this\.)\bfont_class\b", "this.abc.font_class"),
    @("(?<!this\.)\bstrwh\b", "this.abc.strwh"),
    @("(?<!this\.)\bxy_str\b", "this.abc.xy_str"),
    @("(?<!this\.)\bcwidf\b", "this.abc.cwidf"),
    @("(?<!this\.)\bout_str\b", "this.abc.out_str"),
    @("(?<!this\.)\bidentify_note\b", "this.abc.identify_note")
)

# Deco.ts Replacements
$replacementsDeco = @(
    @("(?<!this\.|this\.abc\.|[\w\.])(a_de|dd_tb|decos|cross|f_near|f_staff|f_note|do_ctie|deco_def|get_dd|deco_update|deco_width|deco_wch|draw_all_deco|draw_deco_near|draw_deco_note|draw_deco_staff|sh_st|sh_en|sav_fg|out_fg)(?=\b)", 'this.$1'),

    @("(?<!this\.)\bstaff_tb\b", "this.abc.staff_tb"),
    @("(?<!this\.)\bvoice_tb\b", "this.abc.voice_tb"),
    @("(?<!this\.)\brealwidth\b", "this.abc.realwidth"),
    @("(?<!this\.)\btsfirst\b", "this.abc.tsfirst"),
    @("(?<!this\.)\bnstaff\b", "this.abc.nstaff"),
    @("(?<!this\.)\bcur_sy\b", "this.abc.cur_sy"),
    @("(?<!this\.)\bgene\b", "this.abc.gene"),
    @("(?<!this\.)\bcfmt\b", "this.abc.cfmt"),
    @("(?<!this\.)\buser\b", "this.abc.user"),
    @("(?<!this\.)\bglout\b", "this.abc.glout"),
    @("(?<!this\.)\bstv_g\b", "this.abc.stv_g"),
    @("(?<!this\.)\bxypath\b", "this.abc.xypath"),
    @("(?<!this\.)\bxygl\b", "this.abc.xygl"),
    @("(?<!this\.)\bout_wln\b", "this.abc.out_wln"),
    @("(?<!this\.)\by_get\b", "this.abc.y_get"),
    @("(?<!this\.)\by_set\b", "this.abc.y_set"),
    @("(?<!this\.)\bset_scale\b", "this.abc.set_scale"),
    @("(?<!this\.)\bset_sscale\b", "this.abc.set_sscale"),
    @("(?<!this\.)\bset_dscale\b", "this.abc.set_dscale"),
    @("(?<!this\.)\bset_font\b", "this.abc.set_font"),
    @("(?<!this\.)\bget_font\b", "this.abc.get_font"),
    @("(?<!this\.)\bparam_set_font\b", "this.abc.param_set_font"),
    @("(?<!this\.)\bstoptie\b", "this.abc.stoptie"),
    @("(?<!this\.)\berrs\b", "this.abc.errs"),
    @("(?<!this\.)\bparse\b", "this.abc.parse")
)

# Subs.ts Replacements
$replacementsSubs = @(
     @("(?<!this\.|this\.abc\.|[\w\.])(ly_set|draw_lyric_line|draw_lyrics|draw_all_lyrics|add_fstyle|sw_tb|ssw_tb|mw_tb|font_style|strwh|cwidf|clean_txt|str2svg|set_font|out_str|xy_str|trim_title|get_lwidth|write_title|put_inf2r|write_text|put_words|put_history|part_seq|partname|tunhd|write_heading|set_strwh|tspan|put_wline)(?=\b)", 'this.$1'),
    
    @("(?<!this\.)\bcfmt\b", "this.abc.cfmt"),
    @("(?<!this\.)\bgene\b", "this.abc.gene"),
    @("(?<!this\.)\bstaff_tb\b", "this.abc.staff_tb"),
    @("(?<!this\.)\bvoice_tb\b", "this.abc.voice_tb"),
    @("(?<!this\.)\bnstaff\b", "this.abc.nstaff"),
    @("(?<!this\.)\brealwidth\b", "this.abc.realwidth"),
    @("(?<!this\.)\btsfirst\b", "this.abc.tsfirst"),
    @("(?<!this\.)\btsnext\b", "this.abc.tsnext"),
    @("(?<!this\.)\buser\b", "this.abc.user"),
    @("(?<!this\.)\bparse\b", "this.abc.parse"),
    @("(?<!this\.)\bget_font\b", "this.abc.get_font"),
    @("(?<!this\.)\bimg\b", "this.abc.img"),
    @("(?<!this\.)\binfo\b", "this.abc.info"),
    @("(?<!this\.)\bset_page\b", "this.abc.set_page"),
    @("(?<!this\.)\bvskip\b", "this.abc.vskip")
)

# Tune.ts Replacements
$replacementsTune = @(
    @("(?<!this\.)\bcurvoice\b", "this.abc.curvoice"),
    @("(?<!this\.)\bparse\b", "this.abc.parse"),
    @("(?<!this\.)\bgene\b", "this.abc.gene"),
    @("(?<!this\.)\bvoice_tb\b", "this.abc.voice_tb"),
    @("(?<!this\.)\bnstaff\b", "this.abc.nstaff"),
    @("(?<!this\.)\bstaves_found\b", "this.staves_found")
)

# Lyrics.ts Replacements
$replacementsLyrics = @(
    @("(?<!this\.|this\.abc\.|[\w\.])(ly_set|draw_lyric_line|draw_lyrics|draw_all_lyrics)(?=\b)", 'this.$1'),
    @("(?<!this\.)\bcurvoice\b", "this.abc.curvoice"),
    @("(?<!this\.)\bparse\b", "this.abc.parse"),
    @("(?<!this\.)\bgene\b", "this.abc.gene"),
    @("(?<!this\.)\btsfirst\b", "this.abc.tsfirst"),
    @("(?<!this\.)\bstaff_tb\b", "this.abc.staff_tb"),
    @("(?<!this\.)\bvoice_tb\b", "this.abc.voice_tb"),
    @("(?<!this\.)\bnstaff\b", "this.abc.nstaff"),
    @("(?<!this\.)\brealwidth\b", "this.abc.realwidth"),
    @("(?<!this\.)\bget_font\b", "this.abc.get_font"),
    @("(?<!this\.)\bset_font\b", "this.abc.set_font"),
    @("(?<!this\.)\bstr2svg\b", "this.abc.str2svg"),
    @("(?<!this\.)\bxy_str\b", "this.abc.xy_str"),
    @("(?<!this\.)\bout_wln\b", "this.abc.svg.out_wln"),
    @("(?<!this\.)\bout_hyph\b", "this.abc.svg.out_hyph"),
    @("(?<!this\.)\by_get\b", "this.abc.y_get"),
    @("(?<!this\.)\by_set\b", "this.abc.y_set"),
    @("(?<!this\.)\bset_dscale\b", "this.abc.set_dscale"),
    @("(?<!this\.)\banno_start\b", "this.abc.anno_start"),
    @("(?<!this\.)\banno_stop\b", "this.abc.anno_stop"),
    @("(?<!this\.)\bC\.", "abc2svg.C.")
)

Apply-Replace $fileSvg $replacementsSvg
Apply-Replace $fileDeco $replacementsDeco
Apply-Replace $fileSubs $replacementsSubs
Apply-Replace $fileTune $replacementsTune
Apply-Replace $fileLyrics $replacementsLyrics

Write-Host "Refactoring Done"
