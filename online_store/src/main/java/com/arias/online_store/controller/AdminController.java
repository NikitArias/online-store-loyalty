package com.arias.online_store.controller;

import com.arias.online_store.config.JwtUtil;
import com.arias.online_store.dto.OrderStatusUpdateRequest;
import com.arias.online_store.dto.ProductRequest;
import com.arias.online_store.entity.*;
import com.arias.online_store.repository.OrderRepository;
import com.arias.online_store.repository.ProductRepository;
import com.arias.online_store.repository.UserRepository;
import com.arias.online_store.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/admin")
public class AdminController {
    private final ProductService productService;
    private final CategoryService categoryService;
    private final OrderService orderService;
    private final JwtUtil jwtUtil;
    private final ReviewService reviewService;
    private final UserService userService;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Autowired
    public AdminController(ProductService productService, CategoryService categoryService, OrderService orderService,
                           JwtUtil jwtUtil, ReviewService reviewService, UserService userService,
                           ProductRepository productRepository, UserRepository userRepository,
                           OrderRepository orderRepository) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.orderService = orderService;
        this.jwtUtil = jwtUtil;
        this.reviewService = reviewService;
        this.userService = userService;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    private boolean isAdmin(String token) {
        return jwtUtil.extractRole(token).equals("ADMIN");
    }

    @PostMapping("/products/create")
    public ResponseEntity<Product> createProduct(@RequestBody ProductRequest productRequest,
                                                 @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Optional<Category> categoryOpt = categoryService.getCategoryById(productRequest.getCategoryId());
        if (categoryOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Product product = new Product();
        product.setName(productRequest.getName());
        product.setDescription(productRequest.getDescription());
        product.setPrice(productRequest.getPrice());
        product.setStockQuantity(productRequest.getStockQuantity());
        product.setImage(productRequest.getImage());
        product.setCategory(categoryOpt.get());

        Product savedProduct = productService.saveProduct(product);
        return ResponseEntity.ok(savedProduct);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Integer id,
                                                 @RequestBody ProductRequest productRequest,
                                                 @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Optional<Product> updateProduct = productService.updateProduct(id, productRequest);
        return updateProduct.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/product/{id}")
    public ResponseEntity<Map<String, String>> deleteProduct(@PathVariable Integer id,
                                              @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Нет прав для удаления"));

        try {
            boolean deleted = productService.deleteProduct(id);
            return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Товар не найден"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/category/create")
    public ResponseEntity<?> createCategory(@RequestBody Category category,
                                            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Category savedCategory = categoryService.saveCategory(category);
        return savedCategory != null ? ResponseEntity.ok(savedCategory) : ResponseEntity.badRequest().build();
    }

    @PutMapping("/category/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Integer id, @RequestBody Category newCategory,
                                                   @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Optional<Category> updatedCategory = categoryService.updateCategory(id, newCategory);
        return updatedCategory.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

//    Не используется
    @DeleteMapping("/category/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id,
                                               @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        boolean deleted = categoryService.deleteCategory(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Integer id,
                                                   @RequestBody OrderStatusUpdateRequest request,
                                                   @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Доступ запрещен");

        Order updatedOrder = orderService.updateOrderStatus(id, request.getStatus());
        return updatedOrder != null ? ResponseEntity.ok(updatedOrder) : ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/orders/{orderId}")
    public ResponseEntity<Order> deleteOrder(@PathVariable Integer orderId,
                                             @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        boolean deleted = orderService.deleteOrderByAdmin(orderId);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.badRequest().build();
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/reviews/user/{userId}")
    public ResponseEntity<List<Review>> getReviewsByUserAdmin(@RequestHeader("Authorization") String authHeader,
                                                              @PathVariable Integer userId) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        return ResponseEntity.ok(reviewService.getReviewsByUser(userId));
    }

    @DeleteMapping("/reviews/{userId}/{productId}")
    public ResponseEntity<Void> deleteReviewByAdmin(@RequestHeader("Authorization") String authHeader,
                                                    @PathVariable Integer userId,
                                                    @PathVariable Integer productId) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        reviewService.deleteReview(userId, productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @PutMapping("/users/{userId}/block")
    public ResponseEntity<Void> toggleUserBlock(@RequestHeader("Authorization") String authHeader,
                                                @PathVariable Integer userId) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        userService.toggleUserBlock(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats/product-count")
    public ResponseEntity<Long> getProductCount(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        long count = productRepository.count();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/users-count")
    public ResponseEntity<Long> getUsersCount(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        long count = userRepository.count();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/orders")
    public ResponseEntity<Map<String, Object>> getOrderStats(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!isAdmin(token)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Map<String, Object> stats = new HashMap<>();

        stats.put("processing", orderRepository.countByStatus(OrderStatus.PROCESSING));
        stats.put("sent", orderRepository.countByStatus(OrderStatus.SENT));
        stats.put("delivered", orderRepository.countByStatus(OrderStatus.DELIVERED));
        stats.put("cancelled", orderRepository.countByStatus(OrderStatus.CANCELLED));

        BigDecimal totalSales = orderRepository.findByStatus(OrderStatus.DELIVERED)
                .stream()
                .flatMap(order -> order.getOrderItems().stream())
                .map(OrderItem::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        stats.put("totalSales", totalSales);

        return ResponseEntity.ok(stats);
    }
}
