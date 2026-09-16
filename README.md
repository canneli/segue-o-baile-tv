# Segue o Baile TV — portal e estúdio editorial

Portal de matérias com identidade baseada na logo original do Segue o Baile TV. O estúdio em `/estudio` permite que Daniel publique uma matéria com link de vídeo do YouTube, imagem ou vídeo enviado. O cartão, a tipografia, a capa e a página da matéria seguem automaticamente o mesmo padrão do portal.

## Como publicar uma matéria, depois que o site estiver no ar

1. Abra `/estudio` no endereço do portal e entre com a senha editorial.
2. Escolha a categoria e preencha autoria, título, resumo e texto. Separe parágrafos do texto com uma linha em branco.
3. Escolha **Link do YouTube**, **Enviar imagem** ou **Enviar vídeo**. Imagens aceitas: JPG, PNG e WebP. Vídeos enviados: MP4 e WebM, até 25 MB. Para vídeos maiores, publique-os no canal e cole o link do YouTube.
4. Confira o cartão na **prévia em tempo real** à direita. Clique em **Publicar matéria**.
5. A matéria aparecerá no início do portal e ganhará uma página própria. O estúdio mostra o link da matéria publicada.

O conteúdo não precisa ser formatado manualmente: a apresentação é aplicada pelo próprio site. A senha editorial deve ser compartilhada somente com quem pode publicar.

## Antes de usar o estúdio pela primeira vez

O código no GitHub **não deixa o portal no ar sozinho**. Quando chegar a hora de disponibilizar o site, ele precisa de uma implantação compatível com Cloudflare Workers, com um bucket R2 ligado pelo nome `BUCKET` e uma variável secreta `EDITOR_PASSWORD`. As matérias e mídias enviadas são armazenadas nesse bucket; a senha não deve ser incluída no repositório. O endereço público do portal pode ser divulgado, mas `/estudio` exige a senha.

## Conteúdo de exemplo

As seis matérias de exemplo partem de vídeos do [canal oficial Segue o Baile TV](https://www.youtube.com/@SegueoBaileTV/videos). Os textos são chamadas editoriais breves, sem citações atribuídas aos entrevistados; o vídeo incorporado é a fonte principal de cada matéria.

- [Baile funk das antigas](https://www.youtube.com/watch?v=xRmK5hE16ko)
- [Jojo Toddynho](https://www.youtube.com/watch?v=5BkZ09SDxOU)
- [MC Poze, Chefin e Borges](https://www.youtube.com/watch?v=vBOAohQbZJg)
- [Carnavoz 2025](https://www.youtube.com/watch?v=ikauA4VP_Aw)
- [Vitinho na Ilha da Gigóia](https://www.youtube.com/watch?v=MhaYlLIOo0g)
- [João da Verde e Rosa](https://www.youtube.com/watch?v=2r_2mpd4uUA)

## Conferir localmente

Com Node.js 22 ou mais recente:

```sh
node build.mjs
node scripts/preview.mjs
```

Abra `http://127.0.0.1:4173`. A prévia local mostra o portal e a tela de entrada do estúdio, mas não grava matérias; a publicação durável exige o bucket R2 e a senha configurados na implantação.

O código não depende de pacotes npm. `node tests/smoke.mjs` verifica as páginas, o acesso ao estúdio e o fluxo de publicação com armazenamento simulado.
