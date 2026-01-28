import { motion } from "framer-motion";
import { MessageCircle, MapPin, Download } from "lucide-react";
import bgImage from "@assets/generated_images/coimbra_historic_street_at_golden_hour.png";

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black text-white font-sans flex flex-col items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/70 z-10" />
        <img
          src={bgImage}
          alt="Coimbra Street"
          className="w-full h-full object-cover opacity-50 blur-sm"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
        >
          <MessageCircle className="w-10 h-10 text-white fill-white" />
        </motion.div>

        <h1 className="text-2xl font-bold mb-4">Tudo Certo!</h1>
        <p className="text-white/80 mb-8 leading-relaxed">
          A Teresa já recebeu o teu perfil. Ela está analisando as tuas respostas para criar o roteiro perfeito.
        </p>

        <div className="bg-white p-4 rounded-xl w-48 h-48 mx-auto mb-8 flex items-center justify-center shadow-inner">
           {/* Placeholder for QR Code */}
           <div className="w-full h-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
             QR CODE WHATSAPP
           </div>
        </div>

        <button className="w-full py-4 bg-[#25D366] hover:bg-[#1fad53] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/20 mb-4">
          <MessageCircle className="w-5 h-5 fill-current" />
          <span>Abrir WhatsApp da Teresa</span>
        </button>
        
        <p className="text-xs text-white/40">
          Ao clicar, você iniciará uma conversa segura com nosso agente de IA.
        </p>
      </motion.div>
    </div>
  );
}
