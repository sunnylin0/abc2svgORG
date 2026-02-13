$files = @(
    'c:\GitHub\abc2svgORG\src\modules\Svg.ts',
    'c:\GitHub\abc2svgORG\src\modules\Tune.ts'
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing $file"
        $c = Get-Content $file -Raw -Encoding UTF8

        # Fix method definitions: "  this.foo() {" -> "  foo() {"
        # Using -replace which is regex based
        $c = $c -replace '(?m)^(\s*)this\.(\w+)\s*\(', '$1$2('

        # Fix property declarations: "  this.prop: type" -> "  prop: type"
        $c = $c -replace '(?m)^(\s*)this\.(\w+):', '$1$2:'
        
        # Remove invalid declarations like "  this.abc.voice_tb;"
        # Matches indented lines starting with this.abc. and ending with ; or just existing
        $c = $c -replace '(?m)^\s*this\.abc\..*?;[\r\n]*', ''
        
        # Remove "this.abc.this.abc..." leftovers if any
        $prev = ""
        while ($c -ne $prev) {
            $prev = $c
            $c = $c.Replace('this.abc.this.abc.', 'this.abc.')
        }

        Set-Content $file $c -Encoding UTF8
    }
}
Write-Host "Syntax Fix Done"
