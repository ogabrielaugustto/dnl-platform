# Comunicações do caso administrativo

## Escopo

Habilitar as cinco ações de comunicação do caso: primeira comunicação, documentação/segunda comunicação, C1, C1P e C2. Cada ação abre uma mensagem pré-preenchida, permite editar destinatário, assunto e corpo e exige uma etapa final de confirmação.

## Fluxo

1. O administrador escolhe a ação.
2. O diálogo apresenta destinatário, assunto, corpo, nota interna e, para a segunda comunicação, os anexos disponíveis.
3. O administrador seleciona “Revisar envio”.
4. Uma tela somente leitura resume a mensagem, os anexos e o efeito operacional.
5. O envio só é liberado após uma confirmação explícita.
6. O servidor recarrega o caso e valida organização, ID público, destinatário, tipo de ação e limites dos anexos.
7. Após o envio, registra evento, snapshot final, anexos enviados, código de validação e atualiza a etapa do workflow.

## Documentos

A segunda comunicação inclui RHF, SOA, ProofData e metadados disponíveis. Arquivos do caso armazenados no R2 são lidos no servidor e enviados diretamente ao Resend, sem URL pública. RHF e SOA que existam apenas como snapshots assinados são materializados em arquivos HTML autocontidos. Documentos ausentes ficam visíveis na prévia e não bloqueiam o envio; nenhum anexo individual pode exceder 10 MB e o conjunto não pode exceder 35 MB.

## Segurança e falhas

Somente administradores podem executar a ação. O servidor não confia em nome do cliente, domínio, URL, estágio ou documentos enviados pelo navegador. Falhas na leitura de qualquer anexo ou no envio impedem o registro de sucesso. O histórico guarda somente nomes, tipos, tamanhos e IDs dos anexos, nunca seu conteúdo ou chaves privadas.

## Verificação

Testes unitários cobrem mapeamento de ações, prévias, seleção e limites de anexos. A entrega também exige typecheck, lint focado, suíte relevante e verificação de whitespace.
