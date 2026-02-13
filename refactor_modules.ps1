$files = @(
    'c:\GitHub\abc2svgORG\src\modules\Deco.ts',
    'c:\GitHub\abc2svgORG\src\modules\Lyrics.ts',
    'c:\GitHub\abc2svgORG\src\modules\Subs.ts'
)

$props_abc = 'cfmt|gene|staff_tb|voice_tb|nstaff|tsfirst|tsnext|tslast|realwidth|posx|posy|img|blocks|blkdiv|defs|cache|error|insert_meter|spf_last|smallest_duration|dx_tb|hw_tb|w_note|curvoice|user|get_font|set_font|out_wln|out_hyph|y_get|y_set|set_scale|set_sscale|set_dscale|strwh|draw_all_chsy|draw_all_deco|out_deco_val|out_deco_str|out_deco_long|xygl|g_open|g_close|anno_start|anno_stop|writempo|param_set_font|out_sxsy|out_svg|out_kp|blk_flush|partname|part_seq|put_history|write_text|write_title|write_heading|get_lwidth|put_words|put_inf2r|xy_str|out_str|str2svg|cwidf|tspan|clean_txt|trim_title|get_sym'

# Regex for word boundary
$regexPropsAbc = "(?<!this\.|this\.abc\.|abc\.|get |set |var |let |const |class |: |function |=> )\b($props_abc)\b"

$props_self = 'a_de|dd_tb|cross|deco_def|f_near|f_note|f_staff|decos|a_dcn|get_dd|d_near|d_slide|d_arp|d_upstaff|do_ctie'
$regexPropsSelf = "(?<!this\.|get |set |var |let |const |class |: |function |=> )\b($props_self)\b"

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file"
        $c = Get-Content $file -Raw -Encoding UTF8

        # Replace Abc properties/methods
        $c = [Regex]::Replace($c, $regexPropsAbc, 'this.abc.$1')

        # Replace Self properties/methods
        $c = [Regex]::Replace($c, $regexPropsSelf, 'this.$1')

        # Replace errs
        $c = [Regex]::Replace($c, '(?<!this\.|abc\.)\berrs\b', 'this.abc.errs')
        
        # Replace global C.
        # $c = [Regex]::Replace($c, '(?<!\.)\bC\.', 'abc2svg.C.') # Assuming C is imported as abc2svg.C or C is available

        # Convert function declarations to methods (heuristic)
        # function foo(...) { -> foo(...) {
        # But only if indented (inside class)
        $c = [Regex]::Replace($c, '(?m)^(\s*)function\s+(\w+)\s*\(', '$1$2(')

        # Convert Abc.prototype.foo = function() ... -> foo() ...
        $c = [Regex]::Replace($c, '(?m)^\s*Abc\.prototype\.(\w+)\s*=\s*function\s*', '$1')

        Set-Content $file $c -Encoding UTF8
    }
}
Write-Host "Done"
