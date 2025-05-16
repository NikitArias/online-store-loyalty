package com.arias.online_store.controller;

import com.arias.online_store.entity.*;
import com.arias.online_store.service.AchievementService;
import com.arias.online_store.service.OrderService;
import com.arias.online_store.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
public class OrderController {
    private final OrderService orderService;
    private final UserService userService;
    private final AchievementService achievementService;

    @Autowired
    public OrderController(OrderService orderService, UserService userService, AchievementService achievementService) {
        this.orderService = orderService;
        this.userService = userService;
        this.achievementService = achievementService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Integer id) {
        Order order = orderService.getOrderById(id);
        return order != null ? ResponseEntity.ok(order) : ResponseEntity.notFound().build();
    }

    @GetMapping("/user")
    public ResponseEntity<List<Map<String, Object>>> getOrdersByUser(@AuthenticationPrincipal UserDetails userDetails) {
        System.out.println("userDetails: " + userDetails);
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Order> orders = orderService.getOrdersByUser(user.get());

        List<Map<String, Object>> response = orders.stream().map(order -> {
            Map<String, Object> map = new HashMap<>();
            map.put("order", order);
            map.put("finalPrice", order.getFinalPrice());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/cart")
    public ResponseEntity<Map<String, Object>> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Order> processingOrder = orderService.getProcessingOrderByUser(user.get());
        if (processingOrder.isEmpty()) {
            return ResponseEntity.ok().body(null);
        }

        Order order = processingOrder.get();

        List<UserAchievement> activeBonuses = achievementService.getActiveBonuses(user.get());

        String appliedBonusCode = getAppliedBonusCode(activeBonuses);

        String appliedBonusTitle = null;
        if (appliedBonusCode != null) {
            appliedBonusTitle = activeBonuses.stream()
                    .map(UserAchievement::getAchievement)
                    .filter(ach -> appliedBonusCode.equals(ach.getConditionCode()))
                    .map(Achievement::getTitle)
                    .findFirst()
                    .orElse(null);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("order", order);
        response.put("appliedBonusCode", appliedBonusCode);
        response.put("appliedBonusTitle", appliedBonusTitle);

        return ResponseEntity.ok(response);
    }

    private String getAppliedBonusCode(List<UserAchievement> bonuses) {
        Map<String, BigDecimal> discountMap = Map.of(
                "first_order", BigDecimal.valueOf(0.95),
                "order_count_3", BigDecimal.valueOf(0.90),
                "order_count_5", BigDecimal.valueOf(0.85)
        );

        return bonuses.stream()
                .min(Comparator.comparing(
                        bonus -> discountMap.getOrDefault(bonus.getAchievement().getConditionCode(), BigDecimal.ONE)
                ))
                .map(bonus -> bonus.getAchievement().getConditionCode())
                .orElse(null);
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        if (order.getItems().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        order.setStatus(OrderStatus.PROCESSING);
        Order createdOrder = orderService.createOrder(order);
        return ResponseEntity.ok(createdOrder);
    }

    @PostMapping("/items/{productId}")
    public ResponseEntity<Order> addItemToOrder(@AuthenticationPrincipal UserDetails userDetails,
                                                @PathVariable Integer productId) {
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Order updatedOrder = orderService.addItemToOrder(user.orElse(null), productId, 1);
        return updatedOrder != null ? ResponseEntity.ok(updatedOrder) : ResponseEntity.badRequest().build();
    }

    @PutMapping("/items/{productId}/{quantity}")
    public ResponseEntity<?> addMultipleItemsToOrder(@AuthenticationPrincipal UserDetails userDetails,
                                                         @PathVariable Integer productId,
                                                         @PathVariable int quantity) {

        if (quantity <= 0) {
            return ResponseEntity.badRequest().body("Количество должно быть больше 0");
        }

        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Пользователь не найден");
        }

        try {
            Order updateOrder = orderService.updateItemQuantity(user.get(), productId, quantity);
            Map<String, Object> response = new HashMap<>();
            response.put("order", updateOrder);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> deleteOrder(@AuthenticationPrincipal UserDetails userDetails,
                                            @PathVariable Integer orderId) {
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        boolean deleted = orderService.deleteOrder(user.get(), orderId);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<Map<String, Object>> removeItemFromOrder(@AuthenticationPrincipal UserDetails userDetails,
                                                                   @PathVariable Integer productId) {
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Order updatedOrder = orderService.removeItemFromOrder(user.get(), productId);

        Map<String, Object> response = new HashMap<>();
        response.put("order", updatedOrder);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/items/{productId}/decrease")
    public ResponseEntity<Map<String, Object>> decreaseItemQuantity(@AuthenticationPrincipal UserDetails userDetails,
                                                                    @PathVariable Integer productId) {
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Order updatedOrder = orderService.decreaseItemQuantity(user.get(), productId);

        Map<String, Object> response = new HashMap<>();
        response.put("order", updatedOrder);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/sent")
    public ResponseEntity<Order> markOrderAsSent(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Order updatedOrder = orderService.markOrderAsSent(user.get());
        return updatedOrder != null ? ResponseEntity.ok(updatedOrder) : ResponseEntity.badRequest().build();
    }

    @PutMapping("/cancel/{orderId}")
    public ResponseEntity<Order> cancelOrder(@AuthenticationPrincipal UserDetails userDetails,
                                             @PathVariable Integer orderId) {
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Order cancelledOrder = orderService.cancelOrder(user.get(), orderId);
        return cancelledOrder != null ? ResponseEntity.ok(cancelledOrder) : ResponseEntity.badRequest().build();
    }

    @RestControllerAdvice
    public static class GlobalExceptionHandler {
        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<String> illegalArgumentException(IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
