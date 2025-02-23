# declare the base image
FROM nginx:alpine

# Định nghĩa thư mục làm việc
WORKDIR /usr/share/nginx/html

# Sao chép toàn bộ mã nguồn vào thư mục web server
COPY . .

# Mở cổng 80 để truy cập ứng dụng
EXPOSE 80

# Khởi động Nginx ở chế độ foreground
CMD ["nginx", "-g", "daemon off;"]
