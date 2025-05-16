package com.arias.online_store.controller;

import com.arias.online_store.entity.Review;
import com.arias.online_store.entity.User;
import com.arias.online_store.service.ReviewService;
import com.arias.online_store.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    @GetMapping("/{productId}")
    public ResponseEntity<List<Review>> getReviewsByProduct(@PathVariable Integer productId) {
        List<Review> reviews = reviewService.getReviewsByProduct(productId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/user")
    public ResponseEntity<List<Review>> getReviewsByUser(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);
        return user.map(value -> ResponseEntity.ok(reviewService.getReviewsByUser(value.getId())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());

    }

    @PostMapping("/product/{productId}")
    public ResponseEntity<Review> addReview(@AuthenticationPrincipal UserDetails userDetails,
                                            @PathVariable Integer productId,
                                            @RequestParam Integer rating,
                                            @RequestParam(required = false) String comment) {
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Review review = reviewService.addReview(user.get().getId(), productId, rating, comment);
        return ResponseEntity.ok(review);
    }

    @DeleteMapping("/product/{productId}")
    public ResponseEntity<Void> deleteReview(@AuthenticationPrincipal UserDetails userDetails,
                                             @PathVariable Integer productId) {
        String email = userDetails.getUsername();
        Optional<User> user = userService.getUserByEmail(email);

        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        reviewService.deleteReview(user.get().getId(), productId);
        return ResponseEntity.noContent().build();
    }
}
