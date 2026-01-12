import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, User, Brain, Zap, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">Ajustes gerais da plataforma</p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="memory" className="gap-2">
              <Brain className="w-4 h-4" />
              Memória IA
            </TabsTrigger>
            <TabsTrigger value="triggers" className="gap-2">
              <Zap className="w-4 h-4" />
              Triggers
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card variant="gradient">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Informações do Perfil
                </CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais e de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome Completo</label>
                    <Input defaultValue="Administrador ISA" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input defaultValue="admin@isa.app" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefone</label>
                    <Input defaultValue="(11) 99999-0000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Empresa</label>
                    <Input defaultValue="ISA Technologies" />
                  </div>
                </div>
                <Button variant="hero">
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Memory Tab */}
          <TabsContent value="memory">
            <Card variant="gradient">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Memória da IA
                </CardTitle>
                <CardDescription>
                  Configure o contexto e conhecimento base da ISA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contexto da Empresa</label>
                  <Textarea 
                    placeholder="Descreva sua empresa, produtos/serviços, tom de voz desejado..."
                    className="min-h-32"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">FAQ Automático</label>
                  <Textarea 
                    placeholder="Adicione perguntas frequentes e suas respostas..."
                    className="min-h-32"
                  />
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Dica:</strong> Quanto mais contexto você fornecer, mais precisas serão as respostas da ISA.
                  </p>
                </div>
                <Button variant="hero">
                  <Save className="w-4 h-4" />
                  Salvar Memória
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Triggers Tab */}
          <TabsContent value="triggers">
            <Card variant="gradient">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Triggers e Automações
                </CardTitle>
                <CardDescription>
                  Configure gatilhos para ações automáticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
                  <div className="text-center">
                    <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Sistema de triggers em desenvolvimento</p>
                    <p className="text-sm text-muted-foreground mt-1">Em breve você poderá configurar automações avançadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
