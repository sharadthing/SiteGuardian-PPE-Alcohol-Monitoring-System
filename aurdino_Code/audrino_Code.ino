#include <LiquidCrystal.h>

// LCD Pins (RS, E, D4, D5, D6, D7)
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  Serial.begin(9600);       //This initialises serial for RPi
  lcd.begin(16, 2);        // This initialises LCD
  lcd.print("Alcohol:");    // Static title
}

void loop() {
  int rawADC = analogRead(A0);
  int alcoholPercent = map(rawADC, 120, 900, 0, 100);
  alcoholPercent = constrain(alcoholPercent, 0, 100);

  // Display on LCD
  lcd.setCursor(0, 1);
  lcd.print("       ");
  lcd.setCursor(0, 1);
  lcd.print(alcoholPercent);
  lcd.print("%");

  // Send to Raspberry Pi (critical addition!)
  Serial.print("Alcohol:");
  Serial.println(alcoholPercent);

  delay(1000);
}