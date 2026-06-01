export interface Camping {
    id: number;
    nome: string;
    descricao: string;
    latitude: number;
    longitude: number;
    cidade: string;
    estado: string;
    tipo: string;
    endereco: string;
    telefone: string;
    avaliacao: number;
    fotoPrincipal: string;
    recursos: Recurso[];
}
export interface Recurso {
    nome: string;
    disponivel: boolean;
}
