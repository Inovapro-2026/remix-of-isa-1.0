import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, Send, Loader2, User, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  created_at: string;
  is_verified_purchase: boolean | null;
}

interface ProductReviewsProps {
  productId: string;
  colors: {
    background: string;
    text: string;
    buttons: string;
    accent: string;
    card: string;
    border: string;
    muted: string;
  };
}

export const ProductReviews = ({ productId, colors }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    customer_name: "",
    customer_phone: "",
  });

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newReview.customer_phone.trim()) {
      toast.error("Informe seu WhatsApp para avaliar");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        rating: newReview.rating,
        comment: newReview.comment || null,
        customer_name: newReview.customer_name || null,
        customer_phone: newReview.customer_phone.replace(/\D/g, ""),
        is_visible: true,
        is_verified_purchase: false,
      });

      if (error) throw error;

      toast.success("Avaliação enviada com sucesso!");
      setShowForm(false);
      setNewReview({ rating: 5, comment: "", customer_name: "", customer_phone: "" });
      loadReviews();
    } catch (err: any) {
      console.error("Error submitting review:", err);
      toast.error(err.message || "Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onRate?.(star)}
          disabled={!interactive}
          className={`transition-transform ${interactive ? "hover:scale-125 cursor-pointer" : ""}`}
        >
          <Star
            className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : ""}`}
            style={{ color: star <= rating ? "#FBBF24" : colors.muted }}
          />
        </button>
      ))}
    </div>
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mt-6">
      {/* Summary */}
      <div
        className="flex items-center justify-between p-4 rounded-xl mb-4"
        style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            <span className="text-2xl font-bold" style={{ color: colors.text }}>
              {averageRating.toFixed(1)}
            </span>
          </div>
          <span className="text-sm" style={{ color: colors.muted }}>
            ({reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"})
          </span>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          variant="outline"
          size="sm"
          style={{ borderColor: colors.buttons, color: colors.buttons }}
        >
          Avaliar
        </Button>
      </div>

      {/* Review Form */}
      {showForm && (
        <div
          className="p-4 rounded-xl mb-4 animate-in fade-in slide-in-from-top"
          style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
        >
          <h4 className="font-medium mb-4" style={{ color: colors.text }}>
            Deixe sua avaliação
          </h4>

          <div className="space-y-4">
            <div>
              <label className="text-sm mb-2 block" style={{ color: colors.muted }}>
                Sua nota
              </label>
              <StarRating
                rating={newReview.rating}
                onRate={(r) => setNewReview((prev) => ({ ...prev, rating: r }))}
                interactive
              />
            </div>

            <div>
              <label className="text-sm mb-2 block" style={{ color: colors.muted }}>
                Seu nome (opcional)
              </label>
              <Input
                value={newReview.customer_name}
                onChange={(e) => setNewReview((prev) => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Como você quer ser chamado?"
                style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
              />
            </div>

            <div>
              <label className="text-sm mb-2 block" style={{ color: colors.muted }}>
                Seu WhatsApp *
              </label>
              <Input
                value={newReview.customer_phone}
                onChange={(e) => setNewReview((prev) => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
              />
            </div>

            <div>
              <label className="text-sm mb-2 block" style={{ color: colors.muted }}>
                Comentário (opcional)
              </label>
              <Textarea
                value={newReview.comment}
                onChange={(e) => setNewReview((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Conte sua experiência..."
                rows={3}
                style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              style={{ backgroundColor: colors.buttons, color: "#fff" }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar avaliação
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.muted }} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: colors.muted }}>
            Seja o primeiro a avaliar!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-xl"
              style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.buttons + "20" }}
                  >
                    <User className="h-5 w-5" style={{ color: colors.buttons }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: colors.text }}>
                        {review.customer_name || "Cliente"}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <CheckCircle className="h-3 w-3" />
                          Compra verificada
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: colors.muted }}>
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>

              {review.comment && (
                <p className="text-sm mt-3" style={{ color: colors.text }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
