$files = @(
    'c:\GitHub\abc2svgORG\src\modules\Svg.ts',
    'c:\GitHub\abc2svgORG\src\modules\Tune.ts',
    'c:\GitHub\abc2svgORG\src\modules\Subs.ts',
    'c:\GitHub\abc2svgORG\src\modules\Deco.ts',
    'c:\GitHub\abc2svgORG\src\modules\Lyrics.ts'
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing v2 $file"
        $c = Get-Content $file -Raw -Encoding UTF8

        # Fix "  this.prop = val" -> "  prop = val" (property initialization in class)
        $c = $c -replace '(?m)^(\s*)this\.(\w+)\s*=', '$1$2 ='

        # Fix "  this.prop: type" -> "  prop: type" (property declaration)
        # Assuming types don't start with . (to avoid matching methods if any)
        $c = $c -replace '(?m)^(\s*)this\.(\w+)\s*:', '$1$2:'

        if ($file -match 'Tune.ts') {
            # Fix the broken logic around line 63
            # Pattern: 
            # if (this.abc.curvoice.last_sym)
            # else
            # We replace it with correct logic
            $broken = "if \(this\.abc\.curvoice\.last_sym\)\s*else"
            $fixed = "if (this.abc.curvoice.last_sym) this.abc.curvoice.last_sym.next = s;`r`n            else this.abc.curvoice.sym = s;"
            $c = [Regex]::Replace($c, $broken, $fixed)
        }

        Set-Content $file $c -Encoding UTF8
    }
}
Write-Host "Fix v2 Done"
