from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from PIL import Image
from io import BytesIO
from transformers import pipeline

app = Flask(__name__)
CORS(app)

print("Memuat model Deep Learning dari Hugging Face (tunggu sebentar)...")
# Menggunakan model Vision Transformer khusus pendeteksi gambar AI
detector_pipeline = pipeline("image-classification", model="umm-maybe/AI-image-detector")
print("Model berhasil dimuat dan siap digunakan!")

@app.route('/detect', methods=['POST'])
def detect():
    data = request.json
    image_url = data.get('imageUrl')
    print("\n--- Menerima Permintaan Deteksi ---")
    print("URL Gambar:", image_url)
    
    try:
        # 1. Unduh gambar dari URL
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(image_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return jsonify({"status": "error", "message": "Gagal mengunduh gambar dari web."})
            
        # Konversi gambar ke format RGB agar kompatibel dengan model
        img = Image.open(BytesIO(response.content)).convert("RGB")
        
        # 2. Proses analisis menggunakan model Hugging Face
        results = detector_pipeline(img)
        print("Hasil dari model:", results)
        
        # Cari skor untuk kategori AI / Artificial
        ai_score = 0.0
        for res in results:
            label_name = res['label'].lower()
            score_val = res['score'] * 100
            # Model ini biasanya menghasilkan label 'ai' / 'human' atau sejenisnya
            if 'ai' in label_name or 'fake' in label_name or 'artificial' in label_name:
                ai_score = score_val
                break
        else:
            # Jika label utamanya bukan 'ai', ambil skor dari hasil teratas jika relevan
            top_label = results[0]['label'].lower()
            if 'artificial' in top_label or 'generated' in top_label:
                ai_score = results[0]['score'] * 100
            else:
                ai_score = (1.0 - results[0]['score']) * 100 if 'human' in top_label or 'real' in top_label else results[0]['score'] * 100

        ai_score = round(ai_score, 1)
        status_teks = f"{ai_score}% Kemungkinan Buatan AI" if ai_score > 50 else f"{round(100 - ai_score, 1)}% Kemungkinan Foto Asli"
        
        print("Hasil Akhir:", status_teks)
        
        return jsonify({
            "status": "success",
            "message": status_teks
        })
        
    except Exception as e:
        print("Error saat memproses gambar:", e)
        return jsonify({
            "status": "error",
            "message": "Gagal memproses model: " + str(e)
        })

if __name__ == '__main__':
    app.run(port=5000, debug=True)