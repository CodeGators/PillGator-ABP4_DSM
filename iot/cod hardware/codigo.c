#include <Servo.h>
#include <Adafruit_LiquidCrystal.h>

Adafruit_LiquidCrystal lcd(0); 

Servo servo1, servo2, servo3;
const int leds[] = {7, 6, 5}; 
const int pinoBuzzer = 8;
const int sensores[] = {2, 3, 4}; // Pinos dos botões (Gavetas 1, 2 e 3)

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

  for(int i=0; i<3; i++) {
    pinMode(leds[i], OUTPUT);
    // INPUT_PULLUP usa o resistor interno, o botão envia LOW quando clicado
    pinMode(sensores[i], INPUT_PULLUP); 
  }
  pinMode(pinoBuzzer, OUTPUT);
}

void atualizarVisor(String linha1, String linha2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(linha1);
  lcd.setCursor(0, 1);
  lcd.print(linha2);
}

void tocarAvisoAgradavel() {
  for (int i = 0; i < 2; i++) {
    tone(pinoBuzzer, 523); 
    delay(150);
    tone(pinoBuzzer, 659); 
    delay(150);
    tone(pinoBuzzer, 784); 
    delay(300);             
    noTone(pinoBuzzer);     
    delay(1400);            
  }
}

void tocarAlertaErro() {
  for(int i=0; i<3; i++) {
    tone(pinoBuzzer, 250); 
    delay(300);
    noTone(pinoBuzzer);
    delay(100);
  }
}

void liberarRemedio(int gaveta, String nome, String hora) {
  atualizarVisor("AGORA: " + nome, "Abra a gaveta!");
  digitalWrite(leds[gaveta-1], HIGH);

  // Destranca a gaveta
  if(gaveta == 1) servo1.write(90);
  else if(gaveta == 2) servo2.write(90);
  else if(gaveta == 3) servo3.write(90);

  tocarAvisoAgradavel(); 

  bool gavetaAberta = false;
  
  // Loop de espera: 10 segundos para clicar no botão no Tinkercad
  for(int i = 0; i < 100; i++) { 
    if(digitalRead(sensores[gaveta-1]) == LOW) { 
      gavetaAberta = true;
      break; 
    }
    delay(100); 
  }

  // Verifica se o paciente tirou o remédio ou ignorou
  if(gavetaAberta) {
    atualizarVisor("Remedio retirado", "Fechando...");
    delay(3000); 
  } else {
    atualizarVisor("ALERTA: Ignorado", "Remedio na caixa");
    tocarAlertaErro();
    delay(3000);
  }

  // Tranca a gaveta
  if(gaveta == 1) servo1.write(0);
  else if(gaveta == 2) servo2.write(0);
  else if(gaveta == 3) servo3.write(0);

  digitalWrite(leds[gaveta-1], LOW);
}

void loop() {
  // GAVETA 1
  atualizarVisor("Prox: Remedio A", "Horario: 08:00");
  delay(5000); 
  liberarRemedio(1, "Remedio A", "08:00");

  // GAVETA 2
  atualizarVisor("Prox: Remedio B", "Horario: 14:00");
  delay(5000);
  liberarRemedio(2, "Remedio B", "14:00");

  // GAVETA 3
  atualizarVisor("Prox: Remedio C", "Horario: 20:00");
  delay(5000);
  liberarRemedio(3, "Remedio C", "20:00");
}
