import cv2
import numpy as np
import requests
import time

def main():
    cap = cv2.VideoCapture(0)
    last_qr_data = None
    last_scan_time = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture image")
            break

        _, jpeg = cv2.imencode('.jpg', frame)

        response = requests.post('http://127.0.0.1:5000/scan', files={'image': jpeg.tobytes()})

        if response.status_code == 200:
            qr_data = response.json().get('qr_data')

            if qr_data and qr_data != last_qr_data:
                last_qr_data = qr_data
                last_scan_time = time.time()
                print("Decoded Data:", qr_data)

        cv2.imshow("QR Code Scanner", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
