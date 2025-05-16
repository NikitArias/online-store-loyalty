import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Achievements.css";

function Achievements() {
    const { token } = useAuth();
    const API_URL = process.env.REACT_APP_API_URL;

    const [allAchievements, setAllAchievements] = useState([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const response = await fetch(`${API_URL}/achievements`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                });

                if (response.ok) {
                    const data = await response.json();
                    setAllAchievements(data);
                } else {
                    console.error("Ошибка загрузки достижений");
                }
            } catch (error) {
                console.error("Ошибка при запросе достижений: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAchievements();
    }, [API_URL]);

    useEffect(() => {
        const fetchUnlockedAchievements = async () => {
            if (!token) return;

            try {
                const response = await fetch(`${API_URL}/user/achievements`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                });

                if (response.ok) {
                    const data = await response.json();
                    setUnlockedAchievements(data);
                } else {
                    console.error("Ошибка загрузки полученных достижений");
                }
            } catch (error) {
                console.error("Ошибка при запросе полученных достижений: ", error);
            }
        };

        fetchUnlockedAchievements();
    }, [API_URL, token]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка достижений...</p>
            </div>
        );
    }

    return (
        <div className="achievements-page">
            <h2>Достижения</h2>
            {!isOnline ? (
                <p className="offline-message">Нет подключения к интернету</p>
            ) : (
                <div className="achievements-list">
                    {allAchievements.map((achievement) => {
                        const isUnlocked = unlockedAchievements.some(a => a.id === achievement.id);
                        const bonusUsed = unlockedAchievements.find(a => a.id === achievement.id)?.bonusUsed;
                        return (
                            <div
                                key={achievement.id}
                                className={`achievement-card ${isUnlocked ? "unlocked" : "locked"}`}
                            >
                                <h3>{achievement.title}</h3>
                                <p>{achievement.description}</p>
                                {achievement.reward && (
                                    <p className="reward">Награда: {achievement.reward}</p>
                                )}
                                {isUnlocked && (
                                    <>
                                        <span className="status">Получено</span>
                                        <span className={`bonus-used ${bonusUsed ? "used" : "not-used"}`}>
                                            Награда {bonusUsed ? "использована" : "не использована"}
                                        </span>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Achievements;