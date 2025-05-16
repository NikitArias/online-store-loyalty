import React from "react";
import "../styles/ReviewModal.css";

function formatDate(dateString) {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString("ru-RU", options);
}

function calculateAverageRating(reviews) {
    if (reviews.length === 0) return null;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
}

function ReviewModal({ reviews, productName, onClose }) {
    const averageRating = calculateAverageRating(reviews);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h2>Отзывы на {productName}</h2>
                {reviews.length > 0 && (
                    <p className="average-rating">Средний рейтинг: ⭐{averageRating}⭐</p>
                )}
                {reviews.length > 0 ? (
                    reviews.map(review => (
                        <div key={review.user.id} className="review">
                            <p><strong>{review.user.name}</strong></p>
                            <p>Рейтинг: ⭐{review.rating}⭐</p>
                            {review.comment && <p>{review.comment}</p>}
                            <p className="review-date">{formatDate(review.createdAt)}</p>
                        </div>
                    ))
                ) : (
                    <p>Отзывов пока нет</p>
                )}
            </div>
        </div>
    );
}

export default ReviewModal;