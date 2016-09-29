import sys, json, numpy as np
import cv2
import time

camera=cv2.VideoCapture(0)
face_cascade = cv2.CascadeClassifier('/usr/share/opencv/haarcascades/haarcascade_frontalface_alt.xml')








def main():
    #get our data as an array from read_in()
    ret, image=camera.read()
    gray = cv2.cvtColor(image,cv2.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(gray, 
				scaleFactor=1.3, 
				minNeighbors=3, 
				minSize=(30,30), 
				flags=cv2.CASCADE_SCALE_IMAGE) 
    cv2.imwrite('/home/pi/smartdoor/result.jpg',image)
    print str(len(faces))

#start process
if __name__ == '__main__':
    main()
