$files = @(
    'c:\GitHub\abc2svgORG\src\modules\Svg.ts',
    'c:\GitHub\abc2svgORG\src\modules\Deco.ts',
    'c:\GitHub\abc2svgORG\src\modules\Tune.ts',
    'c:\GitHub\abc2svgORG\src\modules\Subs.ts',
    'c:\GitHub\abc2svgORG\src\modules\Lyrics.ts'
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Cleaning Functions in $file"
        $c = Get-Content $file -Raw -Encoding UTF8

        # Fix "function this.name(" -> "function name("
        $c = $c -replace 'function\s+this\.(\w+)', 'function $1'

        # Fix "  this.method() {" -> "  method() {" (Method definition)
        # Using a slightly different regex to be sure
        $c = $c -replace '(?m)^(\s*)this\.(\w+)\s*\(\s*', '$1$2('
        
        # Also clean up "this.abc.this.abc." again just in case
        $prev = ""
        while ($c -ne $prev) {
            $prev = $c
            $c = $c.Replace('this.abc.this.abc.', 'this.abc.')
            $c = $c.Replace('this.this.', 'this.')
        }

        Set-Content $file $c -Encoding UTF8
    }
}
Write-Host "Function Cleanup Done"
