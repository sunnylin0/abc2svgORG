$files = @(
    'c:\GitHub\abc2svgORG\src\modules\Svg.ts',
    'c:\GitHub\abc2svgORG\src\modules\Deco.ts',
    'c:\GitHub\abc2svgORG\src\modules\Tune.ts',
    'c:\GitHub\abc2svgORG\src\modules\Subs.ts',
    'c:\GitHub\abc2svgORG\src\modules\Lyrics.ts'
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Cleaning $file"
        $c = Get-Content $file -Raw -Encoding UTF8

        # 1. Fix method definitions: "this.methodName() {" -> "methodName() {"
        # We look for "this.name(" at start of line (indented) followed by "{" eventually
        $c = [Regex]::Replace($c, '(?m)^(\s*)this\.(\w+)\s*\(', '$1$2(')

        # 2. Fix double/triple this.abc.
        # Run loop until no change
        $prev = ""
        while ($c -ne $prev) {
            $prev = $c
            $c = $c.Replace('this.abc.this.abc.', 'this.abc.')
            $c = $c.Replace('this.this.', 'this.')
            $c = $c.Replace('abc.this.abc.', 'this.abc.') # Case where 'this.' was missing but 'abc.' was there? unlikely but safe
        }

        # 3. Fix property declarations in class body (Tune.ts specifically had this.staves_found)
        # Look for "this.propName =" or "this.propName;" at class level indentation (usually 1 tab or 4 spaces)
        # But wait, inside methods "this.prop = val" is valid.
        # We only want to change it if it is a declaration. Declarations usually have type or ; or = literal.
        # And they are usually directly inside class.
        # A simpler heuristic for Tune.ts line 11:
        $c = $c.Replace('	this.staves_found:', '	staves_found:')
        $c = $c.Replace('	this.tsfirst:', '	tsfirst:')
        
        # 4. Fix specific messes I saw in Svg.ts
        # "this.abc.this.abc.this.abc.voice_tb" - handled by step 2
        
        # 5. Fix "this.output" in comments? Optional.
        
        Set-Content $file $c -Encoding UTF8
    }
}
Write-Host "Cleanup Done"
