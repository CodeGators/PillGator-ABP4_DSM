#include <Servo.h>
#include <Adafruit_LiquidCrystal.h>

Adafruit_LiquidCrystal lcd(0); 

Servo servo1, servo2, servo3;
const int leds[] = {7, 6, 5}; 
const int pinoBuzzer = 8;

void setup() {
  lcd.begin(16, 2);
  lcd.setBacklight(1); 
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("PillGator V1.0");
  lcd.setCursor(0, 1);
  lcd.print("Iniciando...");
  delay(2000);

  servo1.attach(9);
  servo2.attach(10);
  servo3.attach(11);
  
  servo1.write(0);
  servo2.write(0);
  servo3.write(0);

  for(int i=0; i<3; i++) pinMode(leds[i], OUTPUT);
  pinMode(pinoBuzzer, OUTPUT);
}

void atualizarVisor(String linha1, String linha2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(linha1);
  lcd.setCursor(0, 1);
  lcd.print(linha2);
}

// --- NOVA FUNÇÃO: AVISO AGRADÁVEL E MAIS GRAVE ---
void tocarAvisoAgradavel() {
  // Frequências mais baixas para um som mais grave e encorpado
  for (int i = 0; i < 2; i++) {
    tone(pinoBuzzer, 523); // Nota Dó (C5) - Reduzido de 1047
    delay(150);
    tone(pinoBuzzer, 659); // Nota Mi (E5) - Reduzido de 1319
    delay(150);
    tone(pinoBuzzer, 784); // Nota Sol (G5) - Reduzido de 1568
    delay(300);             
    
    noTone(pinoBuzzer);     
    delay(1400);            
  }
  
  // Completa o tempo para fechar exatos 5 segundos de gaveta aberta
  delay(1000); 
}

void liberarRemedio(int gaveta, String nome, String hora) {
  atualizarVisor("AGORA: " + nome, "HORA: " + hora);
  
  digitalWrite(leds[gaveta-1], HIGH);

  // Abre a gaveta correspondente
  if(gaveta == 1) servo1.write(90);
  else if(gaveta == 2) servo2.write(90);
  else if(gaveta == 3) servo3.write(90);

  // Toca o som agradável e grave
  tocarAvisoAgradavel(); 

  // Tranca novamente
  if(gaveta == 1) servo1.write(0);
  else if(gaveta == 2) servo2.write(0);
  else if(gaveta == 3) servo3.write(0);

  digitalWrite(leds[gaveta-1], LOW);
}

void loop() {
  // GAVETA 1
  atualizarVisor("PROX: Remedio A", "HORA: 08:00");
  delay(5000); 
  liberarRemedio(1, "Remedio A", "08:00");

  // GAVETA 2
  atualizarVisor("PROX: Remedio B", "HORA: 14:00");
  delay(5000);
  liberarRemedio(2, "Remedio B", "14:00");

  // GAVETA 3
  atualizarVisor("PROX: Remedio C", "HORA: 20:00");
  delay(5000);
  liberarRemedio(3, "Remedio C", "20:00");
}
