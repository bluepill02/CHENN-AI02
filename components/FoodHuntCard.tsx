import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useAuth } from "./auth/SupabaseAuthProvider";
import { FoodHuntService, type FoodHuntPost } from "../services/FoodHuntService";
import { toast } from "sonner";
import { Loader2, MapPin, Utensils, Trash2 } from "lucide-react";
import { Textarea } from "./ui/textarea";

interface FoodHuntCardProps {
    pincode: string;
}

export default function FoodHuntCard({ pincode }: FoodHuntCardProps) {
    const { user } = useAuth();
    const [posts, setPosts] = useState<FoodHuntPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [restaurantName, setRestaurantName] = useState("");
    const [dishName, setDishName] = useState("");
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState("");
    const [priceRange, setPriceRange] = useState<"cheap" | "moderate" | "expensive">("moderate");

    // Fetch posts
    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await FoodHuntService.getPosts(pincode);
            setPosts(data);
        } catch (error) {
            console.error("Error fetching food posts:", error);
            toast.error("Failed to load food reviews");
        } finally {
            setLoading(false);
        }
    };

    // Subscribe to real-time updates
    useEffect(() => {
        fetchPosts();

        const unsubscribe = FoodHuntService.subscribeToUpdates(pincode, (payload) => {
            console.log("Real-time update:", payload);
            fetchPosts();
        });

        return () => {
            unsubscribe();
        };
    }, [pincode]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please sign in to post reviews");
            return;
        }

        if (!restaurantName.trim()) {
            toast.error("Restaurant name is required");
            return;
        }

        try {
            setSubmitting(true);

            await FoodHuntService.createPost(
                {
                    restaurant_name: restaurantName,
                    dish_name: dishName || undefined,
                    rating,
                    review: review || undefined,
                    price_range: priceRange,
                    pincode,
                },
                user.id
            );

            toast.success("Review posted successfully!");
            resetForm();
            setFormOpen(false);
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setRestaurantName("");
        setDishName("");
        setRating(5);
        setReview("");
        setPriceRange("moderate");
    };

    // Delete post
    const handleDelete = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        try {
            await FoodHuntService.deletePost(postId);
            toast.success("Review deleted");
        } catch (error) {
            toast.error("Failed to delete review");
        }
    };

    const getPriceLabel = (range?: string) => {
        switch (range) {
            case "cheap": return "₹ Budget";
            case "moderate": return "₹₹ Moderate";
            case "expensive": return "₹₹₹ Premium";
            default: return "";
        }
    };

    return (
        <Card className="p-3 border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium flex items-center gap-2 text-[#4B1E1E]">
                    🍽️ Food Hunt
                    <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                        {pincode}
                    </Badge>
                </h4>
                {user && (
                    <Button
                        size="sm"
                        onClick={() => {
                            resetForm();
                            setFormOpen(!formOpen);
                        }}
                        variant={formOpen ? "ghost" : "default"}
                        className={`h-7 text-xs ${formOpen ? "text-orange-700 hover:bg-orange-100" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
                    >
                        {formOpen ? "Cancel" : "Post Review"}
                    </Button>
                )}
            </div>

            {/* Create Form */}
            {formOpen && (
                <form onSubmit={handleSubmit} className="mb-3 space-y-3 p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
                    <div className="text-sm font-medium text-gray-900">
                        Share your food find!
                    </div>

                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Restaurant Name (e.g., Murugan Idli Shop)"
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                        />

                        <input
                            type="text"
                            placeholder="Dish Name (optional)"
                            value={dishName}
                            onChange={(e) => setDishName(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-gray-600 block mb-1">Rating</label>
                            <select
                                value={rating}
                                onChange={(e) => setRating(Number(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                                <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                                <option value={4}>⭐⭐⭐⭐ (4)</option>
                                <option value={3}>⭐⭐⭐ (3)</option>
                                <option value={2}>⭐⭐ (2)</option>
                                <option value={1}>⭐ (1)</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-600 block mb-1">Price</label>
                            <select
                                value={priceRange}
                                onChange={(e) => setPriceRange(e.target.value as any)}
                                className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                                <option value="cheap">₹ Budget</option>
                                <option value="moderate">₹₹ Moderate</option>
                                <option value="expensive">₹₹₹ Premium</option>
                            </select>
                        </div>
                    </div>

                    <Textarea
                        placeholder="Your review... (e.g., Best sambar in town!)"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={2}
                        className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        size="sm"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            "Post Review"
                        )}
                    </Button>
                </form>
            )}

            {/* Posts List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                        Loading reviews...
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-sm text-gray-600 text-center py-6 bg-white/50 rounded-lg border border-dashed border-orange-200">
                        <Utensils className="w-8 h-8 text-orange-200 mx-auto mb-2" />
                        No food reviews yet.
                        {user && <div className="text-xs mt-1">Be the first to recommend!</div>}
                    </div>
                ) : (
                    posts.map((post) => {
                        const isOwner = user?.id === post.user_id;

                        return (
                            <div
                                key={post.id}
                                className="bg-white border border-orange-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                                            {post.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate text-[#4B1E1E]">
                                                {post.restaurant_name}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <span className="text-orange-500 font-medium">
                                                    {"⭐".repeat(post.rating)}
                                                </span>
                                                <span>•</span>
                                                <span>{getPriceLabel(post.price_range)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {isOwner && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                            onClick={() => handleDelete(post.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>

                                {/* Dish Name */}
                                {post.dish_name && (
                                    <div className="mb-2">
                                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100 text-xs font-normal">
                                            <Utensils className="w-3 h-3 mr-1" />
                                            {post.dish_name}
                                        </Badge>
                                    </div>
                                )}

                                {/* Review */}
                                {post.review && (
                                    <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 mb-2 italic">
                                        "{post.review}"
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-1 text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {pincode}
                                    </div>
                                    <div>
                                        by {post.profiles?.full_name || "Anonymous"}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Card>
    );
}
