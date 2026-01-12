import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Upload, CheckCircle, Loader2, ImageIcon, X, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClientData {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  matricula: string;
  company_name: string | null;
  phone: string | null;
  expiration_date: string | null;
}

const RenovarPlano = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [matricula, setMatricula] = useState("");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSearchMatricula = async () => {
    if (!matricula.trim() || matricula.length !== 6) {
      toast.error("Digite uma matrícula válida (6 dígitos)");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, user_id, full_name, email, matricula, company_name, phone, expiration_date')
        .eq('matricula', matricula.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Matrícula não encontrada");
        return;
      }

      setClientData(data);
    } catch (error: any) {
      console.error('Error searching matricula:', error);
      toast.error("Erro ao buscar dados: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
  };

  const handleReset = () => {
    setClientData(null);
    setIsConfirmed(false);
    setMatricula("");
    clearSelectedFile();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione uma imagem");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientData) {
      toast.error("Dados do cliente não encontrados");
      return;
    }

    if (!selectedFile) {
      toast.error("Envie o comprovante de pagamento");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload receipt to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${clientData.matricula}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Create renewal request
      const { error: insertError } = await supabase
        .from('plan_renewals')
        .insert({
          user_id: clientData.user_id || '00000000-0000-0000-0000-000000000000',
          client_id: clientData.id,
          matricula: clientData.matricula,
          full_name: clientData.full_name,
          email: clientData.email,
          receipt_url: urlData.publicUrl,
          status: 'pending',
          amount: 97
        });

      if (insertError) {
        throw insertError;
      }

      setIsSubmitted(true);
      toast.success("Comprovante enviado com sucesso!");
    } catch (error: any) {
      console.error('Error submitting renewal:', error);
      toast.error("Erro ao enviar comprovante: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold">Comprovante Enviado!</h2>
              <p className="text-muted-foreground">
                Sua solicitação de renovação foi enviada para análise. 
                Você receberá uma confirmação em até 24 horas.
              </p>
              <div className="pt-4 space-y-2">
                <Button onClick={() => navigate('/login')} className="w-full">
                  Ir para Login
                </Button>
                <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                  Voltar ao Início
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl gradient-button flex items-center justify-center mb-4">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Renovação de Plano</CardTitle>
          <CardDescription>
            {!clientData 
              ? "Digite sua matrícula para buscar seus dados"
              : !isConfirmed 
                ? "Confirme seus dados para continuar"
                : "Envie seu comprovante de pagamento"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!clientData ? (
            // Step 1: Search by matricula
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <div className="flex gap-2">
                  <Input
                    id="matricula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ''))}
                    placeholder="Digite sua matrícula (6 dígitos)"
                    maxLength={6}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSearchMatricula}
                    disabled={isSearching || matricula.length !== 6}
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : !isConfirmed ? (
            // Step 2: Confirm data
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-muted/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{clientData.full_name}</p>
                    <p className="text-sm text-muted-foreground">Matrícula: {clientData.matricula}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{clientData.email}</span>
                  </div>
                  {clientData.company_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Empresa:</span>
                      <span>{clientData.company_name}</span>
                    </div>
                  )}
                  {clientData.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span>{clientData.phone}</span>
                    </div>
                  )}
                  {clientData.expiration_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vencimento atual:</span>
                      <span>{new Date(clientData.expiration_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Estes são seus dados?
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Não, voltar
                </Button>
                <Button onClick={handleConfirm} className="flex-1 gradient-button">
                  Sim, confirmar
                </Button>
              </div>
            </div>
          ) : (
            // Step 3: Upload receipt
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-lg border border-border bg-muted/30 text-sm">
                <p className="font-medium">{clientData.full_name}</p>
                <p className="text-muted-foreground">Matrícula: {clientData.matricula}</p>
              </div>

              <div className="space-y-2">
                <Label>Comprovante de Pagamento</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img 
                      src={previewUrl} 
                      alt="Preview do comprovante" 
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar o comprovante
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG ou JPEG (máx. 5MB)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleReset} className="flex-1">
                  Voltar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 gradient-button"
                  disabled={isSubmitting || !selectedFile}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RenovarPlano;
