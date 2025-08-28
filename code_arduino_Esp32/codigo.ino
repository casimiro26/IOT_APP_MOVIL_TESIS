#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configuración de WiFi (Wokwi proporciona una red virtual)
const char* ssid = "Wokwi-GUEST";
const char* password = "";
const int wifiChannel = 6;

// Configuración del servidor
const char* serverUrl = "https://api-app-android-studio-tesis.onrender.com/datos";
const char* token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTc5OWMwNzA5MDNmMDQ1NGU2Nzc1NSIsIm5vbWJyZVVzdWFyaW8iOiJqaGFuNzgiLCJpYXQiOjE3NTU4MTQ5OTcsImV4cCI6MTc1NTgxODU5N30.EryeIlzMSYdqCm7qp2gatdr_7SePzuq8gkkTj2Mf8CQ"; // Token JWT
//el token tienes que conseguirlo por postman, qal ingresar la cuenta.

// Configuración de pines (según tu conexión real)
const int pirPin = 14;   // Pin del sensor PIR (OUT)
const int ledPin = 12;   // Pin del LED
const int buzzerPin = 13; // Pin del buzzer

// Variables globales
int eventosTotales = 0; 
int eventosCriticos = 0; 
unsigned long ultimaDeteccion = 0; 
bool movimientoActivo = false; 

// Función para simular datos
void generarDatosSimulados(int &horas, int &eventosTotales, int &eventosCriticos) {
  horas = random(1, 25); 
  eventosTotales = ::eventosTotales; 
  eventosCriticos = ::eventosCriticos; 
}

void setup() {
  pinMode(pirPin, INPUT);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  noTone(buzzerPin);

  Serial.begin(115200);
  Serial.println("Iniciando ESP32...");

  // Conectar a WiFi
  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password, wifiChannel);
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.println(" ¡Conectado!");
  Serial.println("IP asignada: " + WiFi.localIP().toString());
}

void loop() {
  int pirEstado = digitalRead(pirPin);
  unsigned long tiempoActual = millis();

  Serial.println("Estado PIR: " + String(pirEstado == HIGH ? "Movimiento" : "Sin movimiento"));

  if (pirEstado == HIGH) {
    if (!movimientoActivo) {
      movimientoActivo = true;
      eventosTotales++;
      Serial.println("Movimiento detectado! Eventos totales: " + String(eventosTotales));
      digitalWrite(ledPin, HIGH); 
      tone(buzzerPin, 1000); 
      ultimaDeteccion = tiempoActual;
    }

    if (tiempoActual - ultimaDeteccion >= 2000) {
      eventosCriticos++;
      Serial.println("Evento crítico registrado! Eventos críticos: " + String(eventosCriticos));
      ultimaDeteccion = tiempoActual; 
    }
  } else {
    if (movimientoActivo) {
      movimientoActivo = false;
      digitalWrite(ledPin, LOW); 
      noTone(buzzerPin); 
      Serial.println("Movimiento terminado.");
    }
  }

  // Enviar datos cada 5 segundos
  static unsigned long ultimoEnvio = 0;
  if (tiempoActual - ultimoEnvio >= 5000) {
    int horas, eventosTotalesLocal, eventosCriticosLocal;
    generarDatosSimulados(horas, eventosTotalesLocal, eventosCriticosLocal);

    StaticJsonDocument<200> doc;
    doc["horasMonitoreadas"] = horas;
    doc["eventosTotales"] = eventosTotalesLocal;
    doc["eventosCriticos"] = eventosCriticosLocal;
    String json;
    serializeJson(doc, json);

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", String("Bearer ") + token);

      Serial.println("Enviando datos: " + json);
      int httpCode = http.POST(json);
      if (httpCode > 0) {
        String response = http.getString();
        Serial.println("Código HTTP: " + String(httpCode));
        Serial.println("Respuesta: " + response);
      } else {
        Serial.println("Error en la solicitud HTTP: " + String(httpCode));
      }
      http.end();
    } else {
      Serial.println("WiFi no conectado, intentando reconectar...");
      WiFi.begin(ssid, password, wifiChannel);
    }

    ultimoEnvio = tiempoActual;
  }

  delay(100); 
}
