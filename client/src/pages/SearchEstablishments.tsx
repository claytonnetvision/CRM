import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Phone, Globe, Star, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const BRAZILIAN_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
];

export default function SearchEstablishments() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchType, setSearchType] = useState<"crossfit" | "studio" | "funcional">("crossfit");
  const [selectedState, setSelectedState] = useState("MG");
  const [selectedCity, setSelectedCity] = useState("Belo Horizonte");
  const [customQuery, setCustomQuery] = useState("");
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  const searchQuery = trpc.googleMaps.searchEstablishments.useQuery(
    { 
      type: customQuery ? undefined : searchType,
      query: customQuery || undefined,
      location: customQuery ? undefined : `${selectedCity}, ${selectedState}, Brasil`
    },
    { enabled: false }
  );
  
  const createLeadMutation = trpc.leads.create.useMutation();
  const importMutation = trpc.googleMaps.importLeads.useMutation();

  const handleSearch = async () => {
    if (customQuery.trim()) {
      // Search by custom query (name)
      try {
        await searchQuery.refetch();
        toast.success("Busca realizada com sucesso!");
      } catch (error: any) {
        toast.error(error.message || "Erro ao buscar estabelecimentos");
      }
    } else if (selectedCity.trim()) {
      // Search by type/state/city
      try {
        await searchQuery.refetch();
        toast.success("Busca realizada com sucesso!");
      } catch (error: any) {
        toast.error(error.message || "Erro ao buscar estabelecimentos");
      }
    } else {
      toast.warning("Digite um nome de box ou selecione uma cidade para buscar");
    }
  };

  const handleImportSelected = async () => {
    if (selectedResults.size === 0) {
      toast.warning("Selecione pelo menos um estabelecimento");
      return;
    }

    setIsImporting(true);
    try {
      let imported = 0;
      const errors: string[] = [];
      
      for (const result of searchQuery.data || []) {
        if (selectedResults.has(result.id)) {
          try {
            await createLeadMutation.mutateAsync({
              googlePlaceId: result.id,
              name: result.name,
              address: result.address,
              phone: result.phone,
              website: result.website,
              latitude: result.latitude,
              longitude: result.longitude,
              type: searchType === "crossfit" ? "crossfit_box" : searchType === "studio" ? "studio" : "functional",
              rating: result.rating,
              reviewCount: result.reviewCount,
            });
            imported++;
            console.log(`Lead importado: ${result.name}`);
          } catch (error: any) {
            console.error("Erro ao importar lead:", error);
            errors.push(`${result.name}: ${error.message || "Erro desconhecido"}`);
            toast.error(`Erro ao importar ${result.name}: ${error.message}`);
          }
        }
      }
      
      if (imported > 0) {
        toast.success(`${imported} estabelecimentos importados com sucesso!`);
        setSelectedResults(new Set());
        setTimeout(() => navigate("/leads"), 1000);
      } else if (errors.length > 0) {
        toast.error(`Nenhum estabelecimento foi importado. Erros: ${errors[0]}`);
      }
    } catch (error: any) {
      console.error("Erro geral na importação:", error);
      toast.error(error.message || "Erro ao importar estabelecimentos");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportAll = async () => {
    setIsImporting(true);
    try {
      const result = await importMutation.mutateAsync({
        type: searchType,
        limit: 20,
      });
      toast.success(`${result.imported} de ${result.total} estabelecimentos importados!`);
      setTimeout(() => navigate("/leads"), 1000);
    } catch (error: any) {
      console.error("Erro ao importar todos:", error);
      toast.error(error.message || "Erro ao importar estabelecimentos");
    } finally {
      setIsImporting(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedResults(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/leads")}
          className="hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Buscar Estabelecimentos</h1>
          <p className="text-muted-foreground mt-1">Encontre Boxes de CrossFit, Studios e Funcionais em todo o Brasil</p>
        </div>
      </div>

      {/* Search Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Estabelecimento</label>
              <Select value={searchType} onValueChange={(v) => setSearchType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crossfit">CrossFit Boxes</SelectItem>
                  <SelectItem value="studio">Studios de Fitness</SelectItem>
                  <SelectItem value="funcional">Funcionais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <Input
                placeholder="Ex: Belo Horizonte"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={searchQuery.isFetching}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {searchQuery.isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  "Buscar"
                )}
              </Button>
            </div>
          </div>

          <div className="md:col-span-4">
            <label className="block text-sm font-medium mb-2">Busca por Nome do Box (Alternativa)</label>
            <Input
              placeholder="Ex: CrossFit Premium, Academia XYZ, Ares Fit..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <p className="text-xs text-muted-foreground mt-1">💡 Digite o nome de um box para buscá-lo diretamente, ou deixe em branco e use os filtros acima</p>
          </div>
        </div>
      </Card>

      {/* Results */}
      {searchQuery.data && searchQuery.data.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {searchQuery.data?.length} estabelecimentos encontrados
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedResults(new Set(searchQuery.data?.map((r: any) => r.id) || []))}
              >
                Selecionar Todos
              </Button>
              <Button
                onClick={handleImportSelected}
                disabled={selectedResults.size === 0 || isImporting}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Importar Selecionados ({selectedResults.size})
              </Button>
              <Button
                onClick={handleImportAll}
                disabled={isImporting}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Importar Todos (até 20)
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchQuery.data?.map((result: any) => (
              <Card
                key={result.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedResults.has(result.id)
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:shadow-lg"
                }`}
                onClick={() => toggleSelection(result.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm line-clamp-2">{result.name}</h3>
                    <input
                      type="checkbox"
                      checked={selectedResults.has(result.id)}
                      onChange={() => toggleSelection(result.id)}
                      className="w-4 h-4 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {result.address && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{result.address}</span>
                    </div>
                  )}

                  {result.phone && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="w-3 h-3" />
                      <a href={`tel:${result.phone}`} className="text-blue-600 hover:underline">
                        {result.phone}
                      </a>
                    </div>
                  )}

                  {result.website && (
                    <div className="flex items-center gap-2 text-xs">
                      <Globe className="w-3 h-3" />
                      <a
                        href={result.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {result.website}
                      </a>
                    </div>
                  )}

                  {result.rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>
                        {result.rating} ({result.reviewCount} avaliações)
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery.isSuccess && searchQuery.data && searchQuery.data.length === 0 && (
        <Card className="p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum estabelecimento encontrado</h3>
          <p className="text-muted-foreground">
            Tente buscar em outra cidade ou estado. Certifique-se de que a Google Places API está habilitada.
          </p>
        </Card>
      )}

      {/* Initial State */}
      {!searchQuery.isSuccess && (
        <Card className="p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Comece sua busca</h3>
          <p className="text-muted-foreground">
            Selecione um tipo de estabelecimento, estado e cidade, depois clique em "Buscar" para encontrar novos leads.
          </p>
        </Card>
      )}
    </div>
  );
}
