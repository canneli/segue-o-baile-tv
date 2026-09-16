# Segue o Baile TV — portal e estúdio editorial

Portal com a identidade visual do Segue o Baile TV e seis matérias de exemplo baseadas em vídeos do canal oficial. O site é gerado como páginas estáticas e publicado gratuitamente pelo GitHub Pages em:

**https://canneli.github.io/segue-o-baile-tv/**

## Como Daniel publica uma matéria nova

1. Abra **https://canneli.github.io/segue-o-baile-tv/estudio/**.
2. Preencha título, resumo, categoria, autoria e texto. Separe os parágrafos com uma linha em branco. A prévia mostra o design automaticamente.
3. Escolha um link do YouTube ou envie JPG, PNG, WebP, MP4 ou WebM (até 25 MB). Para vídeo maior, publique no YouTube e cole o link.
4. Cole uma **chave de publicação do GitHub** com permissão de escrita somente neste repositório. Ela não fica salva no navegador nem no site. Clique em **Publicar matéria**.
5. O Estúdio envia o conteúdo ao repositório. A automação do GitHub atualiza o portal em alguns minutos. O botão **Ver atualização do site** mostra o andamento.

### Criar a chave uma vez

No GitHub, vá a **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Selecione apenas o repositório `canneli/segue-o-baile-tv` e a permissão **Contents: Read and write**. Escolha uma validade, copie a chave e guarde-a em um gerenciador de senhas. Daniel precisa ser colaborador do repositório ou usar uma chave emitida por uma conta que tenha permissão de escrita. Nunca cole a chave em uma matéria, mensagem pública ou arquivo do repositório.

O Estúdio é uma página pública; **a chave é o controle de publicação**. Se ela vazar, revogue-a imediatamente no GitHub. Cada envio fica registrado no histórico do repositório.

## Como o site funciona

O GitHub Pages entrega arquivos HTML, CSS e JavaScript; ele não executa servidores nem guarda uploads feitos por visitantes. Por isso, o Estúdio grava matérias em `posts/*.json` e mídias em `media/` por meio da API do GitHub. A automação [pages.yml](.github/workflows/pages.yml) reconstrói as páginas após cada envio. O código antigo de Cloudflare Worker está preservado em `src/worker.js`, mas **não participa da publicação pelo Pages**.

Para uso no GitHub Free, o repositório precisa ser **público** e, em **Settings → Pages → Build and deployment**, a fonte precisa estar em **GitHub Actions**. O Pages exibe o conteúdo publicamente; não coloque senhas ou materiais privados em `posts/` ou `media/`.

## Conteúdo de exemplo

As matérias usam estes vídeos do [canal oficial Segue o Baile TV](https://www.youtube.com/@SegueoBaileTV/videos). Os textos são chamadas editoriais breves, sem falas inventadas ou atribuídas aos entrevistados.

- [Baile funk das antigas](https://www.youtube.com/watch?v=xRmK5hE16ko)
- [Jojo Toddynho](https://www.youtube.com/watch?v=5BkZ09SDxOU)
- [MC Poze, Chefin e Borges](https://www.youtube.com/watch?v=vBOAohQbZJg)
- [Carnavoz 2025](https://www.youtube.com/watch?v=ikauA4VP_Aw)
- [Vitinho na Ilha da Gigóia](https://www.youtube.com/watch?v=MhaYlLIOo0g)
- [João da Verde e Rosa](https://www.youtube.com/watch?v=2r_2mpd4uUA)

## Conferir localmente

Com Node.js 22 ou mais recente, execute `node build.mjs`, `node build-pages.mjs` e `node tests/pages.mjs`. Os arquivos prontos ficam em `dist/pages/`. O teste original do Worker pode ser executado com `node tests/smoke.mjs`.
