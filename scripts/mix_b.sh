set -e
D="$EP_DIR"; cd "$D"
ffmpeg -y -v error -i voice_raw.wav -af "highpass=f=75:poles=2,equalizer=f=140:t=q:w=1:g=2,equalizer=f=320:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1:g=2.5,highshelf=f=9000:g=1.5,deesser=i=0.35,acompressor=threshold=-24dB:ratio=3:attack=6:release=120:knee=4:makeup=3" -ar 48000 -ac 2 voice_p.wav
ffmpeg -y -v error -i voice_p.wav -i music.wav -i sfx.wav -filter_complex "[0:a]asplit=2[v][vsc];[1:a]volume=-11dB[m];[m][vsc]sidechaincompress=threshold=0.06:ratio=2.5:attack=40:release=700:makeup=1[md];[2:a]volume=-9dB[s];[v][md][s]amix=inputs=3:normalize=0:duration=first" -ar 48000 pre_music.wav
for m in music; do
 I=$(ffmpeg -i pre_$m.wav -af ebur128=framelog=quiet -f null - 2>&1 | grep -A1 "Integrated" | grep "I:" | tail -1 | awk '{print $2}')
 G=$(python3 -c "print(-14.0-($I)+0.0)")
 ffmpeg -y -v error -i pre_$m.wav -af "volume=${G}dB,aresample=192000,alimiter=limit=0.89:attack=2:release=60:level=disabled,aresample=48000" mix_$m.wav
 echo $m $I gain $G; ffmpeg -i mix_$m.wav -af ebur128=framelog=quiet -f null - 2>&1 | grep "I:" | tail -1
done
