# "thumbnail-1619427426313.jpg", "thumbnail-1619427450368.jpg", "thumbnail-1619427470906.jpg", "thumbnail-1619427476573.jpg", "thumbnail-1619427483647.jpg", "thumbnail-1619427491048.jpg", "thumbnail-1619427497138.jpg", "thumbnail-1619427503516.jpg", "thumbnail-1619427511976.jpg", "thumbnail-1619427518099.jpg", "thumbnail-1619427525190.jpg", "thumbnail-1619427531736.jpg", "thumbnail-1619427539639.jpg", "thumbnail-1619427553495.jpg"

# Get-ChildItem -Path .\*.jpg | Select-Object -First ($Names.Count) | ForEach-Object {
#     $_ | Rename-Item -NewName ('{0}-{1}' -f $Names[$count++], $_.Name)
# }

# $DataFile = Get-ChildItem -Path .\*.jpg

# $Names | ForEach-Object { $i = 0 } {
#     Rename-Item $DataFile[$i] ($_)
# }

# $Names | ForEach-Object { $i = 0 } {
#     Rename-Item $DataFile[$i] ($_ + $DataFile[$i++].Name)
# }

# foreach ($name in $Names) {
#      $DataFile | Rename-Item -NewName $name 
# }


cd .\Desktop\_Projects\APSIT_Alumni_Portal\test\

$Names = "thumbnail-1619427426313.jpg", "thumbnail-1619427450368.jpg", "thumbnail-1619427470906.jpg", "thumbnail-1619427476573.jpg", "thumbnail-1619427483647.jpg", "thumbnail-1619427491048.jpg", "thumbnail-1619427497138.jpg", "thumbnail-1619427503516.jpg", "thumbnail-1619427511976.jpg", "thumbnail-1619427518099.jpg", "thumbnail-1619427525190.jpg", "thumbnail-1619427531736.jpg", "thumbnail-1619427539639.jpg", "thumbnail-1619427553495.jpg"

$DataFile = Get-ChildItem -Path .\*.jpg

$i=0;
foreach ($item in $DataFile) {
    Rename-Item $item -NewName $Names[$i++];
}