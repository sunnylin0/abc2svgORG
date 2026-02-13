$files = @(
    'c:\GitHub\abc2svgORG\src\modules\Svg.ts',
    'c:\GitHub\abc2svgORG\src\modules\Deco.ts',
    'c:\GitHub\abc2svgORG\src\modules\Tune.ts',
    'c:\GitHub\abc2svgORG\src\modules\Subs.ts',
    'c:\GitHub\abc2svgORG\src\modules\Lyrics.ts'
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Cleaning v3 $file"
        $c = Get-Content $file -Raw -Encoding UTF8

        # 1. Fix method definitions with "this.abc.": "  this.abc.diff(...) {" -> "  diff(...) {"
        $c = $c -replace '(?m)^(\s*)this\.abc\.(\w+)\s*\(', '$1$2('

        # 2. Fix overlapped prefixes like "parser.this.a_dcn" -> "parser.a_dcn"
        # We assume if it's dot.this.prop, it's wrong (should be dot.prop)
        $c = $c -replace '\.this\.(\w+)', '.$1' 
        # CAVEAT: "this.this.prop" became "this.prop" in previous script, but "obj.this.prop" is invalid usuall.
        # "parser.this.a_dcn" -> "parser.a_dcn"

        # 3. Fix "abc.this.abc" which might happen if my previous cleanup "abc.this.abc" -> "this.abc" logic was slightly off for "this.abc.this.abc"
        # but simpler: ".this.abc" -> ".abc" ?
        # Let's target specific known ones matching "this.abc.parser.this."
        $c = $c.Replace('this.abc.parser.this.', 'this.abc.parser.')

        Set-Content $file $c -Encoding UTF8
    }
}
Write-Host "Cleanup v3 Done"
