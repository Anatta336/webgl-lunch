for f in *.png; do
    cwebp -near_lossless 60 -exact -resize 1024 0 "$f" -o "${f%.png}.webp";
done