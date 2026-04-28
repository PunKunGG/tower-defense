# Byte Defense

เกม tower defense เล็กๆ สำหรับเปิดเล่นแก้เบื่อจากไฟล์ `index.html` ได้เลย

## วิธีเล่น

1. เปิด `index.html` ใน browser
2. เลือก tower ด้านขวา แล้วคลิกช่องว่างบนกระดานเพื่อวาง
3. กด `Start Wave` หรือปุ่ม Space เพื่อเริ่ม wave
4. คลิก tower ที่วางแล้วเพื่อ upgrade หรือ sell

## Tower

- Firewall: ยิงเร็ว ใช้เก็บศัตรูบางๆ
- Patch: ยิงช้าแต่แรง และมี splash damage
- Cryo: ยิงเบาแต่ทำให้ศัตรูช้าลง
- Cache: สร้าง credits ระหว่าง wave

## Levels

หน้าแรกของเกมมีเมนูให้เลือกด่านก่อนเริ่มเล่น และเกมจะจำ best score แยกตามด่านไว้ใน browser

- Training Circuit: ด่านง่าย เส้นทางเดียว ยาวกว่า ได้ credits และ core life มากขึ้น
- Split Circuit: ด่านปกติ มี 2 ทางเข้าแล้วไปรวมกลางแมพ
- Triport Breach: ด่านยาก มี 3 ทางเข้า ศัตรูหนาและเริ่มต้นด้วยทรัพยากรน้อยกว่า

## Custom icons

วางรูป tower picker ไว้ที่ `assets/towers` ตามชื่อนี้:

- `firewall.png`
- `patch.png`
- `cryo.png`
- `cache.png`

แนะนำขนาด 128x128 หรือ 256x256 แบบ square PNG. ถ้าไม่มีไฟล์ เกมจะกลับไปใช้ตัวอักษร F/P/C/$ อัตโนมัติ

โลโก้เกมด้านบนและไอคอนบน browser tab ใช้ไฟล์ `assets/logo.png`. แนะนำเป็น PNG สี่เหลี่ยมจัตุรัส 128x128 หรือ 256x256. ถ้าไม่มีไฟล์ เกมจะกลับไปใช้โลโก้ BD เดิมในหน้าเกม ส่วน browser tab จะใช้ไอคอน default ของ browser

## ปุ่มลัด

- `1` ถึง `4`: เลือก tower
- `Space`: เริ่ม wave
- `P`: pause/resume
